import asyncio
import json
from pprint import pprint

import urllib.parse
import httpx
import tiktoken
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=['x-token-len', 'x-cropped'],
)

client = httpx.AsyncClient(http2=True, timeout=httpx.Timeout(timeout=10.0, read=20.0))

ALLOWED_BASEURLS = [
    "https://api.openai.com/v1/",
    "https://openrouter.ai/api/v1/",
    "https://api.endpoints.anyscale.com/v1/",
    "https://api.together.xyz/v1/",
    "https://api.fireworks.ai/inference/v1/",
    "https://api.hyperbolic.xyz/v1/",
    "https://api.deepseek.com/v1/",
    "https://api.groq.com/openai/v1/",

    #
    "https://api.anthropic.com/v1/messages",
    "anthropic://",
    "google://",
]


class ErrorText:
    def __init__(self, text):
        self.text = text
    def __repr__(self) -> str:
        return f'ErrorText({self.text!r})'


async def stream_openai(
        baseurl: str, token: str, model: str, completion: bool, **kwargs):
    json_data = {
        'stream': True,
        'model': model,
        **kwargs,
    }
    if baseurl and completion:
        url = f'{baseurl}completions'
    elif baseurl:
        url = f'{baseurl}chat/completions'
    elif completion:
        url = 'https://api.openai.com/v1/completions'
    else:
        url = 'https://api.openai.com/v1/chat/completions'

    async with client.stream(
            'POST',
            url,
            headers={'Authorization': f"Bearer {token}"},
            json=json_data
        ) as r:
        if r.status_code != 200:
            print(r.status_code, r.headers)
            await r.aread()
            yield ErrorText(str(r.text))
            return

        async for line in r.aiter_lines():
            if line.startswith('data: [DONE]'): break
            if line.startswith('data: '):
                yield json.loads(line.removeprefix('data: '))


async def openai_stream_response(**kwargs):
    async for chunk in stream_openai(**kwargs):
        if isinstance(chunk, ErrorText):
            yield b'API error:\n'
            yield chunk.text.encode('utf-8')
            continue
        try:
            c = chunk['choices'][0]
        except KeyError:
            yield b'Err: ' + str(chunk).encode('utf-8')
            raise
        if 'text' in c:
            yield c['text'].encode('utf-8')
        elif c['delta'].get('content'):  # chat
            yield c['delta']['content'].encode('utf-8')


ANTHROPIC_API_PARAMS = [
    'model', 'messages', 'system', 'max_tokens', 'metadata', 'stop_sequences',
    'temperature', 'top_p', 'top_k'
]

async def stream_anthropic(token: str, **kwargs):
    json_data = {'stream': True}
    for k in ANTHROPIC_API_PARAMS:
        if k in kwargs:
            json_data[k] = kwargs[k]

    async with client.stream(
            'POST',
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': token,
                'anthropic-version': '2023-06-01',
            },
            json=json_data
        ) as r:
        if r.status_code != 200:
            print(r.status_code, r.headers)
            await r.aread()
            yield ErrorText(str(r.text))
            return

        async for line in r.aiter_lines():
            if line.startswith('data: '):
                yield json.loads(line.removeprefix('data: '))


async def anthropic_stream_response(**kwargs):
    messages = kwargs.pop('messages')
    system_msgs = [i for i in messages if i['role'] == 'system']
    if system_msgs:
        kwargs['system'] = system_msgs[0]['content']
        kwargs['messages'] = [i for i in messages if i['role'] != 'system']
    else:
        kwargs['messages'] = messages

    async for chunk in stream_anthropic(**kwargs):
        if isinstance(chunk, ErrorText):
            yield b'API error:\n'
            yield chunk.text.encode('utf-8')
            continue
        if chunk.get('type') == 'error':
            yield json.dumps(chunk)
            continue
        if chunk.get('type') != 'content_block_delta':
            continue
        if chunk['delta']['type'] != 'text_delta':
            continue

        yield chunk['delta']['text'].encode('utf-8')


async def stream_google(token: str, model: str, **kwargs):
    url_model = urllib.parse.quote(model)
    async with client.stream(
            'POST',
            f'https://generativelanguage.googleapis.com/v1beta/models/{url_model}:streamGenerateContent',
            params={'alt': 'sse', 'key': token},
            json=kwargs,
        ) as r:
        if r.status_code != 200:
            print(r.status_code, r.headers)
            await r.aread()
            yield ErrorText(str(r.text))
            return

        async for line in r.aiter_lines():
            if line.startswith('data: '):
                yield json.loads(line.removeprefix('data: '))


async def google_stream_response(token, model, **kwargs):
    converted_data = {
        "contents":[],
        "generationConfig": {
            "responseMimeType": "text/plain"
        },
        "safetySettings": [
            {'category': 'HARM_CATEGORY_HATE_SPEECH', 'threshold': 'BLOCK_NONE'},
            {'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold': 'BLOCK_NONE'},
            {'category': 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold': 'BLOCK_NONE'},
            {'category': 'HARM_CATEGORY_HARASSMENT', 'threshold': 'BLOCK_NONE'},
            {'category': 'HARM_CATEGORY_CIVIC_INTEGRITY', 'threshold': 'BLOCK_NONE'}
        ],
    }

    messages = kwargs['messages']
    system_msgs = [i for i in messages if i['role'] == 'system']
    if system_msgs:
        converted_data['systemInstruction'] = {'parts': [{'text': system_msgs[0]['content']}]}
        messages = [i for i in messages if i['role'] != 'system']
    for i in messages:
        converted_data['contents'].append({
            'role': 'model' if i['role'] == 'assistant' else i['role'],
            'parts': [{'text': i['content']}] if isinstance(i['content'], str) else i['content'],
        })

    if kwargs.get('temperature') is not None:
        converted_data['generationConfig']['temperature'] = kwargs['temperature']
    if kwargs.get('max_tokens') is not None:
        converted_data['generationConfig']['maxOutputTokens'] = kwargs['max_tokens']

    async for chunk in stream_google(token, model, **converted_data):
        if isinstance(chunk, ErrorText):
            yield b'API error:\n'
            yield chunk.text.encode('utf-8')
            continue

        yield chunk['candidates'][0]['content']['parts'][0]['text'].encode('utf-8')


ENC = tiktoken.encoding_for_model("gpt-4o")
def get_message_token_len(message):
    if not isinstance(message.get('content'), str):
        return 0
    return len(ENC.encode(message['content'])) + 4  # TODO: not correct

def crop_history(messages, target_token_len):
    if target_token_len == 0:
        return messages, sum(get_message_token_len(i) for i in messages)

    new_messages = []
    token_len_so_far = 0
    for i in messages[::-1]:
        token_len = get_message_token_len(i)
        if token_len + token_len_so_far > target_token_len:
            break
        token_len_so_far += token_len
        new_messages.append(i)

    if len(messages) > len(new_messages) and (target_token_len - token_len_so_far) >= 10:
        tokens = ENC.encode(i['content'])
        tokens = tokens[-(target_token_len - token_len_so_far):]
        i['content'] = ENC.decode(tokens)
        token_len_so_far += len(tokens)
        new_messages.append(i)

    return new_messages[::-1], token_len_so_far


async def stream_response(**kwargs):
    if not kwargs['token']:
        t = b'This is a dummy response. Update token in settings to get real responses.\n'
        for _ in range(30):
            for i in range(len(t)):
                yield t[i:i+1]
                await asyncio.sleep(0.01)
        return

    if kwargs['baseurl'] == 'google://':
        async for chunk in google_stream_response(**kwargs):
            yield chunk
        return

    if kwargs['baseurl'] in ['anthropic://', 'https://api.anthropic.com/v1/messages']:
        async for chunk in anthropic_stream_response(**kwargs):
            yield chunk
        return

    async for chunk in openai_stream_response(**kwargs):
        yield chunk


@app.post("/chat_completions")
async def post_chat_completions(request: Request):
    data = await request.json()
    if data.get('baseurl') not in ALLOWED_BASEURLS:
        return 'API base url is not allowed'

    cropped_messages, token_len = crop_history(
        data['messages'], data.get('target_token_len', 0)
    )
    kwargs = {}
    completion = bool(data.get('completion'))
    if completion:
        kwargs['prompt'] = ''.join(i['content'] for i in cropped_messages)
    else:
        kwargs['messages'] = cropped_messages

    if data['max_tokens'] != 0:
        kwargs['max_tokens'] = data['max_tokens']

    if data.get('stop'):
        kwargs['stop'] = data['stop']

    s = stream_response(
        token=data.get('token'),
        baseurl=data['baseurl'],
        completion=completion,
        model=data['model'],
        temperature=float(data['temperature']),
        frequency_penalty=float(data['frequency_penalty']),
        presence_penalty=float(data['presence_penalty']),
        **kwargs,
    )
    return StreamingResponse(
        s,
        headers={
            'x-token-len': str(token_len),
            'x-cropped': str(len(data['messages']) - len(cropped_messages)),
        },
        media_type="text/plain"
    )


# must be last
app.mount("/", StaticFiles(directory="app/dist/", html=True), name="static")
