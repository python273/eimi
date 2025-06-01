FROM node:22-alpine

WORKDIR /src/app/

COPY ./app/package.json ./app/package-lock.json ./
RUN npm ci --no-progress

COPY ./app/ /src/app/
RUN npm run build

FROM python:3.13-alpine
RUN pip install pipenv

WORKDIR /src/
COPY ./Pipfile ./Pipfile.lock ./
RUN export PIPENV_MAX_SUBPROCESS=2 && pipenv sync

COPY ./ ./
COPY --from=0 /src/app/dist/ /src/app/dist/
