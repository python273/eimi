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

COMPLETIONS_MODELS = [
    'gpt-3.5-turbo-instruct',
    'gpt-3.5-turbo-instruct-0914',
]

class OpenAiTextError:
    def __init__(self, text):
        self.text = text

async def openai_chat_completions_stream(
        http: httpx.AsyncClient, token: str, model: str, **kwargs):
    json_data = {
        'stream': True,
        'model': model,
        **kwargs,
    }
    if model in COMPLETIONS_MODELS:
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
            yield OpenAiTextError(str(r.text))
            return

        if r.status_code != 200:
            print(r.status_code)
            print(await r.aread())
            yield b'err'
            return

        async for line in r.aiter_lines():
            if line.startswith('data: [DONE]'): break
            line = line.strip()
            if not line: continue
            yield json.loads(line.removeprefix('data: '))

ENC = tiktoken.encoding_for_model("gpt-3.5-turbo")
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

DUMMY_TEXT = 'This is a dummy response. Provide a valid OpenAI API key to get real responses.\n'.encode("utf-8")
async def dummy_openai_chat_completions_stream(**kwargs):
    for i in range(len(DUMMY_TEXT)):
        yield DUMMY_TEXT[i:i+1]

async def stream_response(**kwargs):
    if not kwargs['token']:
        async for chunk in dummy_openai_chat_completions_stream(**kwargs):
            yield chunk
            await asyncio.sleep(0.03)
        return

    resp = openai_chat_completions_stream(client, **kwargs)
    async for chunk in resp:
        if isinstance(chunk, OpenAiTextError):
            yield b'API error:\n'
            yield chunk.text.encode('utf-8')
            continue
        c = chunk['choices'][0]
        if 'text' in c:
            yield c['text'].encode('utf-8')
        elif c['delta'].get('content'):  # chat
            yield c['delta']['content'].encode('utf-8')

@app.post("/chat_completions")
async def post_chat_completions(request: Request):
    data = await request.json()
    cropped_messages, token_len = crop_history(
        data['messages'], data['target_token_len']
    )
    kwargs = {}
    if data['model'] in COMPLETIONS_MODELS:
        kwargs['prompt'] = ''.join(i['content'] for i in cropped_messages)
    else:
        kwargs['messages'] = cropped_messages

    if data['max_tokens'] != 0:
        kwargs['max_tokens'] = data['max_tokens']

    s = stream_response(
        token=data.get('token'),
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
