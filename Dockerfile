# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS frontend-build

WORKDIR /build

COPY code/frontend/package*.json code/frontend/vite.config.js ./code/frontend/
COPY code/frontend/public ./code/frontend/public

RUN mkdir -p /build/code/backend

WORKDIR /build/code/frontend
RUN npm ci
RUN npm run build


FROM python:3.10-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIXELPROOF_ENV=production \
    PIXELPROOF_HOST=0.0.0.0 \
    PIXELPROOF_PORT=8000 \
    PIXELPROOF_DATABASE_PATH=/data/pixelproof.db

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/code/backend

COPY code/backend/requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY code/backend ./
COPY --from=frontend-build /build/code/backend/static ./static

RUN mkdir -p /data

EXPOSE 8000
VOLUME ["/data"]

CMD ["python", "main.py"]
