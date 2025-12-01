from pprint import pprint

import urllib.parse
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, StreamingResponse
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

client = httpx.AsyncClient(
    http2=True,
    timeout=httpx.Timeout(timeout=20.0, connect=5.0, read=180.0)
)

ALLOWED_BASEURLS = [
    "https://api.openai.com/v1/",
    "https://openrouter.ai/api/v1/",
    "https://api.endpoints.anyscale.com/v1/",
    "https://api.together.xyz/v1/",
    "https://api.fireworks.ai/inference/v1/",
    "https://api.hyperbolic.xyz/v1/",
    "https://api.deepseek.com/v1/",
    "https://api.groq.com/openai/v1/",
    "https://api.x.ai/v1/",
    "https://generativelanguage.googleapis.com/v1beta/",
    "https://api.minimax.io/v1",
    "https://api.minimax.io/anthropic/v1/",
    "https://api.kimi.com/coding/v1/",

    #
    "https://api.anthropic.com/v1/messages",
    "anthropic://",
    "google://",
]


async def stream_request_body(method, url, headers, body):
    async with client.stream(method, url, headers=headers, content=body) as response:
        yield response

        async for chunk in response.aiter_bytes():
            yield chunk


@app.post("/proxy/{url:path}")
async def post_proxy(request: Request, url: str):
    url = urllib.parse.unquote(url)

    if not any(url.startswith(base) for base in ALLOWED_BASEURLS):
        return "Proxy error: API base URL is not allowed"

    req_headers = {
        'content-type': 'application/json',
    }
    if 'authorization' in request.headers:
        req_headers['authorization'] = request.headers['authorization']

    for k, v in request.headers.items():
        if k.startswith('x-') or k.startswith('anthropic-'):
            req_headers[k] = v

    r = stream_request_body(request.method, url, req_headers, request.stream())
    response = await anext(r)

    return StreamingResponse(
        r,
        status_code=response.status_code,
        headers={
            # 'content-type': response.headers['content-type'],
            'cache-control': 'no-cache',
        },
        media_type="text/plain"
    )


# must be last
@app.get("/favicon.png")
async def serve_favicon():
    return FileResponse("app/dist/favicon.png")

@app.get("/robots.txt")
async def serve_robots_txt():
    return FileResponse("app/dist/robots.txt")

@app.get("/service-worker.js")
async def serve_service_worker():
    return FileResponse("app/dist/service-worker.js")

@app.get("/manifest.json")
async def serve_manifest():
    return FileResponse("app/dist/manifest.json")

@app.get("/icon.svg")
async def serve_icon():
    return FileResponse("app/dist/icon.svg")

app.mount("/assets", StaticFiles(directory="app/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_index(full_path: str):
    return FileResponse("app/dist/index.html")
