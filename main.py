import asyncio
import json
from pprint import pprint

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

ALLOWED_BASEURLS = [
    "https://api.openai.com/v1/",
    "https://openrouter.ai/api/v1/",
    "https://api.anthropic.com/v1/messages",
    "https://api.endpoints.anyscale.com/v1/",
    "https://api.together.xyz/v1/",
    "https://api.fireworks.ai/inference/v1/",
    "https://api.hyperbolic.xyz/v1/",
    "https://api.deepseek.com/v1/",
]

class ErrorText:
    def __init__(self, text):
        self.text = text

async def openai_chat_completions_stream(
        http: httpx.AsyncClient, baseurl: str, token: str, model: str,
        completion: bool, **kwargs):
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

    async with http.stream(
            'POST',
            url,
            headers={'Authorization': f"Bearer {token}"},
            json=json_data
        ) as r:
        if r.status_code == 400:
            await r.aread()
            yield ErrorText(str(r.text))
            return

        if r.status_code != 200:
            print(r.status_code)
            print(await r.aread())
            yield ErrorText(str(r.text))
            return

        async for line in r.aiter_lines():
            if line.startswith('data: [DONE]'): break
            line = line.strip()
            if not line: continue
            if line.startswith('data: '):
                yield json.loads(line.removeprefix('data: '))

ANTHROPIC_API_PARAMS = [
    'model', 'messages', 'system', 'max_tokens', 'metadata', 'stop_sequences',
    'temperature', 'top_p', 'top_k'
]

async def anthropic_chat_completions_stream(
        http: httpx.AsyncClient, token: str, **kwargs):
    json_data = {'stream': True}
    for k in ANTHROPIC_API_PARAMS:
        if k in kwargs:
            json_data[k] = kwargs[k]

    async with http.stream(
            'POST',
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': token,
                'anthropic-version': '2023-06-01',
            },
            json=json_data
        ) as r:
        if r.status_code == 400:
            await r.aread()
            yield ErrorText(str(r.text))
            return

        if r.status_code != 200:
            print(r.status_code)
            print(await r.aread())
            yield b'err'
            return

        async for line in r.aiter_lines():
            line = line.strip()
            if line.startswith('data: '):
                yield json.loads(line.removeprefix('data: '))

async def anthropic_stream_response(**kwargs):
    resp = anthropic_chat_completions_stream(client, **kwargs)
    async for chunk in resp:
        if isinstance(chunk, ErrorText):
            yield b'API error:\n'
            yield chunk.text.encode('utf-8')
            continue
        if chunk.get('type') != 'content_block_delta':
            continue
        if chunk['delta']['type'] != 'text_delta':
            continue

        yield chunk['delta']['text'].encode('utf-8')

ENC = tiktoken.encoding_for_model("gpt-4o")
def get_message_token_len(message):
    return len(ENC.encode(message['content'])) + 4  # TODO: not correct

def crop_history(messages, target_token_len):
    for i in messages:
        if '~~~~\n' not in i['content']: continue
        new_content = []
        for x, chunk in enumerate(i['content'].split('~~~~\n')):
            if x % 2 == 1: continue
            new_content.append(chunk)
        i['content'] = ''.join(new_content)

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

client = httpx.AsyncClient(http2=True, timeout=15.0)

DUMMY_TEXT = 'This is a dummy response. Update token in settings to get real responses.'.encode("utf-8")


async def stream_response(**kwargs):
    if not kwargs['token']:
        for i in range(len(DUMMY_TEXT)):
            yield DUMMY_TEXT[i:i+1]
            await asyncio.sleep(0.03)
        return

    if kwargs['baseurl'] == 'https://api.anthropic.com/v1/messages':
        messages = kwargs.pop('messages')
        system_msgs = [i for i in messages if i['role'] == 'system']
        if system_msgs:
            kwargs['system'] = system_msgs[0]['content']
            kwargs['messages'] = [i for i in messages if i['role'] != 'system']
        else:
            kwargs['messages'] = messages

        async for chunk in anthropic_stream_response(**kwargs):
            yield chunk
        return

    resp = openai_chat_completions_stream(client, **kwargs)
    async for chunk in resp:
        if isinstance(chunk, ErrorText):
            yield b'API error:\n'
            yield chunk.text.encode('utf-8')
            continue
        try:
            c = chunk['choices'][0]
        except KeyError:
            yield 'Err: ' + str(chunk).encode('utf-8')
            raise
        if 'text' in c:
            yield c['text'].encode('utf-8')
        elif c['delta'].get('content'):  # chat
            yield c['delta']['content'].encode('utf-8')


@app.post("/chat_completions")
async def post_chat_completions(request: Request):
    data = await request.json()
    if data.get('baseurl') not in ALLOWED_BASEURLS:
        return 'API base url is not allowed'

    cropped_messages, token_len = crop_history(
        data['messages'], data['target_token_len']
    )
    kwargs = {}
    completion = bool(data.get('completion'))
    if completion:
        kwargs['prompt'] = ''.join(i['content'] for i in cropped_messages)
    else:
        kwargs['messages'] = cropped_messages

    if data['max_tokens'] != 0:
        kwargs['max_tokens'] = data['max_tokens']

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
