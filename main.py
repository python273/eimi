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
)

async def openai_chat_completions_stream(
        http: httpx.AsyncClient, model: str = 'gpt-3.5-turbo', **kwargs):
    json_data = {
        'stream': True,
        'model': model,
        # "messages": [{"role": "user", "content": ""}]
        'temperature': 0.9,
        'frequency_penalty': 0.3,
        'presence_penalty': 0.3,
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
            raise Exception('OpenAI API error')

        async for line in r.aiter_lines():
            if line == 'data: [DONE]\n': break
            line = line.strip()
            if not line: continue
            yield json.loads(line.removeprefix('data: '))

        await r.aclose()

ENC = tiktoken.encoding_for_model("gpt-3.5-turbo")
def get_message_token_len(message):
    enc = ENC
    return len(enc.encode(message['content'])) + 4  # TODO: not correct

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

    return new_messages[::-1]

client = httpx.AsyncClient(http2=True)

async def stream_response(messages):
    cropped_messages = crop_history(messages)
    resp = openai_chat_completions_stream(
        client,
        messages=cropped_messages
    )
    async for chunk in resp:
        c = chunk['choices'][0]

        if c['delta'].get('content'):
            yield c['delta']['content'].encode('utf-8')

@app.post("/chain")
async def post_chain(request: Request):
    data = await request.json()
    return StreamingResponse(
        stream_response(data['chain']),
        media_type="text/plain"
    )
