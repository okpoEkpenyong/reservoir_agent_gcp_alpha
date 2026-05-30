# ── Exzing Reservoir Agent — Cloud Run Dockerfile (Alpha) ────────────────────
# Uses ADK FastAPI server + built-in Web UI
# No Streamlit in this image
FROM python:3.11-slim

LABEL maintainer="Ekpenyong Okpo <info@exzing.com>"
LABEL org.opencontainers.image.title="Exzing Reservoir Agent"
LABEL org.opencontainers.image.description="AI-powered reservoir engineering — Alpha GCP Edition"
LABEL org.opencontainers.image.vendor="Exzing Technology Ltd."

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    GOOGLE_LOCATION=us-central1 \
    GOOGLE_GENAI_USE_VERTEXAI=FALSE

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

# ADK FastAPI server with built-in Web UI
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
