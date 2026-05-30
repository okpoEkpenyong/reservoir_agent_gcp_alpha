"""
main.py — Exzing Reservoir Agent (Alpha Edition)
FastAPI + ADK Web UI entrypoint for Google Cloud Run.

Replaces the Streamlit beta with the production-grade ADK API server,
which provides:
  - Built-in ADK Web UI (chat interface, session management, trace viewer)
  - REST API endpoints for enterprise integration
  - SSE streaming for real-time agent responses
  - Multi-agent session handling (OrchestratorAgent routes to sub-agents)
  - A2A protocol support alongside the web interface

Run locally:
    uvicorn main:app --host 0.0.0.0 --port 8080 --reload

Deploy to Cloud Run (recommended):
    adk deploy cloud_run --project=$GOOGLE_CLOUD_PROJECT \
        --region=$GOOGLE_CLOUD_LOCATION --with_ui .

Or with gcloud directly:
    gcloud run deploy exzing-reservoir-agent --source . \
        --region us-central1 --allow-unauthenticated

Azure Marketplace clients continue using the Streamlit beta at:
    https://marketplace.microsoft.com/en-us/product/okpo-exzing-research.exzing-reservoir-agent
"""

import os
import asyncio
import logging
import uuid
from typing import AsyncIterator

import uvicorn
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types
from google.genai.types import Content, Part
import sys
from agent import root_agent
import json
from os import getenv
from typing import Annotated, Any

from dotenv import load_dotenv 

# Load environment variables from .env
load_dotenv() 

# Verify the key is loaded (for debugging - remove later)
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("CRITICAL: GOOGLE_API_KEY is not set in environment!")
else:
    print(f"API Key found: {api_key[:5]}...{api_key[-4:]}")


# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

APP_NAME = getenv("APP_NAME", "exzing_reservoir_orchestrator")

# Directory containing agent packages — ADK auto-discovers via __init__.py
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Session persistence — SQLite for dev, Cloud SQL in production
SESSION_SERVICE_URI = os.getenv(
    "SESSION_SERVICE_URI",
    "sqlite+aiosqlite:///./exzing_sessions.db"
)

# CORS — allow Azure Marketplace and local dev origins
ALLOWED_ORIGINS = [
    "https://azuremarketplace.microsoft.com",
    "https://marketplace.microsoft.com",
    "http://localhost",
    "http://localhost:8001",
    "http://localhost:8007",
    "http://localhost:3000",
    "*",
]

# ADK FastAPI app with built-in Web UI (web=True)
# This replaces Streamlit entirely — no prototype tooling in the alpha
app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    session_service_uri=SESSION_SERVICE_URI,
    allow_origins=ALLOWED_ORIGINS,
    web=True,
)

# ── Custom API logic for Frontend ───────────────────────────────────────────

# We use a session service to track history
_session_service = InMemorySessionService()

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    
class ChatResponse(BaseModel):
    """Response model for the chat endpoint."""

    response: str
    session_id: str  


@app.post("/api/chat")
async def chat(
    request: Request,
    prompt: Annotated[str, Form()],
    session_id: Annotated[str | None, Form()] = None,
) -> ChatResponse:
    """Chat endpoint to interact with the Rickbot agent."""
    user_id = 'user.email'  # Use email as user_id for ADK sessions
    
    logger.debug(
        f"Received chat stream request - "
        f"User: {'user.email'}, Session ID: {session_id if session_id else 'None'}"
    )

    current_session_id = session_id if session_id else str(uuid.uuid4())

    # Get the session, or create it if it doesn't exist
    session = await _session_service.get_session(session_id=current_session_id, user_id=user_id, app_name=APP_NAME)
    if not session:
        logger.debug(f"Creating new session: {current_session_id}")
        session = await _session_service.create_session(session_id=current_session_id, user_id=user_id, app_name=APP_NAME)
    else:
        logger.debug(f"Found existing session: {current_session_id}")

    # Construct the message parts
    parts = [Part.from_text(text=prompt)]

    # Associate the role with the message
    new_message = Content(role="user", parts=parts)

    # Create the runner
    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=_session_service,
    )

    # Run the agent and extract response and attachments
    logger.debug(f"Running agent for session: {current_session_id}")
    final_msg = ""
    response_attachments: list[Part] = []
    async for event in runner.run_async(
        user_id=user_id,
        session_id=current_session_id,
        new_message=new_message,
    ):
        # Log tool calls and transfers
        if function_calls := event.get_function_calls():
            for fc in function_calls:
                logger.debug(f"Session {current_session_id} calling tool: {fc.name}")
        if event.actions and event.actions.transfer_to_agent:
            logger.debug(f"Session {current_session_id} transferring to agent: {event.actions.transfer_to_agent}")

        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_msg += part.text
                elif part.inline_data:  # Check for other types of parts (e.g., images)
                    response_attachments.append(part)

    logger.debug(f"Agent for session {current_session_id} finished.")
    logger.debug(f"Final message snippet: {final_msg[:100]}...")

    return ChatResponse(
        response=final_msg,
        session_id=current_session_id,
    )
    

@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    This endpoint is called by the React Frontend.
    It streams tokens from the OrchestratorAgent.
    """
    current_session_id = session_id if session_id else str(uuid.uuid4())

    # Get the session, or create it if it doesn't exist
    session = await session_service.get_session(session_id=current_session_id, user_id=user_id, app_name=APP_NAME)
    if not session:
        logger.debug(f"Creating new session: {current_session_id}")
        session = await session_service.create_session(session_id=current_session_id, user_id=user_id, app_name=APP_NAME)
    else:
        logger.debug(f"Found existing session: {current_session_id}")
        
    session_id = req.session_id or str(uuid.uuid4())
    user_id = "engineer_user"

    # 1. Initialize the ADK Runner
    runner = Runner(
        agent=root_agent,
        app_name="exzing_reservoir_orchestrator",
        session_service=_session_service,
    )

    # 2. Format the user input
    content = genai_types.Content(
        role="user",
        parts=[genai_types.Part(text=req.message)],
    )

    # 3. Generator function for SSE (Server-Sent Events)
    async def event_generator() -> AsyncIterator[str]:
        # Send the session ID first so the frontend can track it
        yield f"data: {json.dumps({'session_id': session_id, 'type': 'start'})}\n\n"

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content,
        ):
            # Extract text tokens from the agent's response
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        payload = {
                            "type": "token",
                            "text": part.text,
                            "author": getattr(event, "author", "Orchestrator"),
                            "final": event.is_final_response()
                        }
                        yield f"data: {json.dumps(payload)}\n\n"
        
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/health")
async def health():
    """Cloud Run health check endpoint."""
    return {
        "status": "healthy",
        "product": "Exzing Reservoir Agent",
        "edition": "alpha",
    }


@app.get("/info")
async def info():
    """Product info for enterprise integration discovery."""
    return {
        "product": "Exzing Reservoir Agent",
        "edition": "Alpha — GCP Edition",
        "vendor": "Exzing Technology Ltd.",
        "version": "2.0.0-alpha",
        "agents": [
            "exzing_reservoir_orchestrator",
            "simulation_qc_agent",
            "production_analyst_agent",
            "exzing_reporting_agent (A2A :8007)",
        ],
        "model": "gemini-2.5-flash",
        "infrastructure": "Google Cloud Run",
        "a2a_reporting_agent": os.getenv(
            "REPORTING_AGENT_URL", "http://localhost:8007"
        ),
        "azure_marketplace": (
            "https://marketplace.microsoft.com/en-us/product/"
            "okpo-exzing-research.exzing-reservoir-agent"
        ),
        "zdr_policy": "Zero-Data Retention — in-memory only",
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
