# Eimi

Eimi is a lightweight threaded UI for LLMs.

- Sessions are stored locally in the browser
- Multi-API: OpenAI, Anthropic, OpenRouter, Google, etc.
- Full context control
- Scripts for context transformation
- Simple HTML and JavaScript execution from code blocks

https://eimi.cns.wtf/

## Dev

```
$ cd app/
$ npm i
$ npm run dev
```

Only required for proxy, can be skipped otherwise:
```
$ pipenv sync
$ pipenv run uvicorn main:app --reload
```

## Prod

See `eimi-prod/` folder for `Dockerfile` and `docker-compose.yml`.

Or build the Svelte app and just host the files.

```bash
$ cd app/
$ npm ci
$ npm run build
$ ls -lah dist/  # serve with nginx
```
