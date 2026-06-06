# Exzing Reservoir Agent — Alpha
# Usage: make <target>

.PHONY: help setup dev build deploy clean

help:
	@echo ""
	@echo "  Exzing Reservoir Agent Alpha"
	@echo "  ─────────────────────────────"
	@echo "  make setup       Install all dependencies"
	@echo "  make dev         Run backend + reporting + frontend locally"
	@echo "  make build       Build Docker images"
	@echo "  make up          Start full stack via docker-compose"
	@echo "  make down        Stop docker-compose stack"
	@echo "  make deploy-all  Build UI and Deploy to Cloud Run"
	@echo "  make clean       Remove build artifacts"
	@echo ""

setup:
	@echo "→ Installing backend dependencies..."
	pip install -r requirements.txt
	@echo "→ Installing frontend dependencies..."
	cd frontend && npm install
	@echo "→ Copying .env template..."
	@test -f .env || cp .env.example .env
	@echo "✓ Setup complete. Edit .env with your GOOGLE_API_KEY"

	
dev:
	@echo "→ Starting Reporting Agent (A2A) on :8007..."
	@uvicorn serve_reporting:app --host 0.0.0.0 --port 8007 &
	@sleep 2
	@echo "→ Starting Backend (ADK + FastAPI) on :8001..."
	@uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
	@sleep 2
	@echo "→ Starting Frontend (React/Vite) on :3000..."
	@cd frontend && npm run dev
	@echo ""
	@echo "  ✓ Stack running:"
	@echo "    Frontend  → http://localhost:3000"
	@echo "    Backend   → http://localhost:8001"
	@echo "    A2A Agent → http://localhost:8007"	

build:
	docker-compose build

up:
	@test -f .env || (echo "ERROR: Create .env first (cp .env.example .env)" && exit 1)
	docker-compose --env-file .env up -d
	@echo "✓ Stack running:"
	@echo "  Frontend  → http://localhost:3000"
	@echo "  Backend   → http://localhost:8001"
	@echo "  A2A Agent → http://localhost:8007"

down:
	docker-compose down
		
	
build-ui:
	@echo "→ Building React Frontend..."
	cd frontend && npm run build
	@echo "→ Moving assets to static folder..."
	python -c "import shutil, os; shutil.rmtree('static', ignore_errors=True); shutil.copytree('frontend/dist', 'static')"	

deploy-all: build-ui
	@echo "→ Deploying to Google Cloud Run..."
	@test -n "$(GOOGLE_CLOUD_PROJECT)" || (echo "ERROR: Set GOOGLE_CLOUD_PROJECT env var" && exit 1)
	adk deploy cloud_run \
		--project=$(GOOGLE_CLOUD_PROJECT) \
		--region=$(GOOGLE_CLOUD_LOCATION) \
		.

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -f ./sessions.db
	rm -f ./exzing_sessions.db
	cd frontend && rm -rf dist node_modules 2>/dev/null || true
	@echo "✓ Clean"