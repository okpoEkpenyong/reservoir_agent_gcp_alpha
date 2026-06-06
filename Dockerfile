# ── STAGE 1: Build the React Frontend ───────────────────────────────────────
FROM node:18-slim AS frontend-builder
WORKDIR /build

# Copy only package files first to leverage Docker cache
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend/ ./
RUN npm run build


# ── STAGE 2: Build the Python Backend ───────────────────────────────────────
FROM python:3.11-slim

# --- RECOVERED FROM YOUR VERSION: Metadata & Env ---
LABEL maintainer="Ekpenyong Okpo <info@exzing.com>"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001 \
    GOOGLE_LOCATION=us-central1 \
    GOOGLE_GENAI_USE_VERTEXAI=TRUE

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the Python source code
COPY . .

# --- THE MAGIC STEP: Sync Frontend dist to Backend static ---
# This copies the result of the Node build into the Python static folder
COPY --from=frontend-builder /build/dist ./static

# --- RECOVERED FROM YOUR VERSION: Security ---
# Ensure the appuser can access the newly copied static files
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Healthcheck (Ensure your main.py has @app.get("/health"))
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

EXPOSE 8001

# Start the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]