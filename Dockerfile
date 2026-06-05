# ── Exzing Reservoir Agent — Cloud Run Dockerfile (Alpha) ────────────────────
FROM python:3.11-slim

LABEL maintainer="Ekpenyong Okpo <info@exzing.com>"

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001 \
    GOOGLE_LOCATION=us-central1 \
    GOOGLE_GENAI_USE_VERTEXAI=FALSE

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

# Ensure the static folder exists (for the UI)
# If you run 'make build-ui' before pushing, this is already there.
# If not, we create an empty one so the FastAPI server doesn't crash.
RUN mkdir -p /app/static

# Security: Run as non-root user
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Healthcheck must match the port the app is listening on
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# EXPOSE is mainly documentation, but it should match the app port
EXPOSE 8001

# Start the application
# We use the shell form so $PORT is correctly evaluated
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]