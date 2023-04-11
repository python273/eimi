import json
from pathlib import Path

import httpx
import tiktoken
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

with open(Path(__file__).parent / 'openai_token.txt') as f:
    OPENAI_API_KEY = f.read().strip()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=['x-token-len', 'x-cropped'],
)

async def openai_chat_completions_stream(http: httpx.AsyncClient, model: str, **kwargs):
    json_data = {
        'stream': True,
        'model': model,
        # "messages": [{"role": "user", "content": ""}]
        **kwargs,
    }
    async with http.stream(
            'POST',
            'https://api.openai.com/v1/chat/completions',
            headers={'Authorization': f"Bearer {OPENAI_API_KEY}"},
            json=json_data
        ) as r:
        if r.status_code != 200:
            print(r.status_code)
            print(await r.aread())
            yield b'err'
            return

        async for line in r.aiter_lines():
            if line == 'data: [DONE]\n': break
            line = line.strip()
            if not line: continue
            yield json.loads(line.removeprefix('data: '))

        await r.aclose()

ENC = tiktoken.encoding_for_model("gpt-3.5-turbo")
def get_message_token_len(message):
    return len(ENC.encode(message['content'])) + 4  # TODO: not correct

def crop_history(messages):
    # This model's maximum context length is 4097 tokens.
    new_messages = []
    token_len_so_far = 0
    for i in messages[::-1]:
        token_len = get_message_token_len(i)
        if token_len + token_len_so_far > (4097 - 300):
            break
        token_len_so_far += token_len
        new_messages.append(i)

    return new_messages[::-1], token_len_so_far

client = httpx.AsyncClient(http2=True, timeout=15.0)

async def stream_response(**kwargs):
    resp = openai_chat_completions_stream(client, **kwargs)
    async for chunk in resp:
        c = chunk['choices'][0]

        if c['delta'].get('content'):
            yield c['delta']['content'].encode('utf-8')

@app.post("/chat_completions")
async def post_chat_completions(request: Request):
    data = await request.json()
    cropped_messages, token_len = crop_history(data['messages'])
    s = stream_response(
        messages=cropped_messages,
        model=data['model'],
        temperature=float(data['temperature']),
        frequency_penalty=float(data['frequency_penalty']),
        presence_penalty=float(data['presence_penalty']),
    )
    return StreamingResponse(
        s,
        headers={
            'x-token-len': str(token_len),
            'x-cropped': str(len(data['messages']) - len(cropped_messages)),
        },
        media_type="text/plain"
    )
