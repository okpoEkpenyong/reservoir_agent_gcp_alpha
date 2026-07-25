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

from dotenv import load_dotenv 

# Load environment variables from .env
load_dotenv() 

import uvicorn
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
from google.adk.models.lite_llm import LiteLlm
import json
from os import getenv
from typing import Annotated, Any
from fastapi import APIRouter
from tools.reservoir_tools import bulk_dca_analysis, qc_eclipse_deck, generate_swof_table
#from agents.reporting.agent import reporting_agent
from routes.feedback import router as feedback_router


# Verify the key is loaded (for debugging - remove later)
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("CRITICAL: GOOGLE_API_KEY is not set in environment!")
else:
    print(f"API Key found: {api_key[:5]}...{api_key[-4:]}")


# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress noisy context detachment warnings from OpenTelemetry
logging.getLogger("opentelemetry.context").setLevel(logging.CRITICAL)

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
    "http://localhost:8008",
    "http://localhost:3000",
    "*",
]

# ADK FastAPI app with built-in Web UI (web=True)
# This replaces Streamlit entirely — no prototype tooling in the alpha
app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    session_service_uri=SESSION_SERVICE_URI,
    allow_origins=ALLOWED_ORIGINS,
    web=False,  # Disable the built-in ADK UI by setting to False for Production builds
)

app.include_router(feedback_router)

# ── Custom API logic for Frontend ───────────────────────────────────────────

# We use a session service to track history
_session_service = InMemorySessionService()


#from google.adk.models import LiteLlm 

LiteLlm.drop_params = True
# Enable LiteLLM's internal logs - this will show the RAW JSON sent to Groq
LiteLlm.set_verbose = True 

import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

class ChatResponse(BaseModel):
    """
    Chat endpoint following the Reservoir Agent pattern.
    Handles Model Re-alignment, Session Persistence, and CoT Stripping.
    """
    response: str
    session_id: str | None = None
    model_id: str  # Mandatory return so frontend knows what brain was used
    



from datetime import datetime

# Input: What React sends
class WellProductionRecord(BaseModel):
    well_name: str
    oil_rates: List[float]

class AssetAnalysisRequest(BaseModel):
    records: List[WellProductionRecord]
    econ_limit: float = 50.0
    model_id: str = "gemini-2.5-flash"

# Output: What Swagger/React receives
class WellResult(BaseModel):
    well_name: str
    qi_stbd: float
    di_per_yr: float
    b_factor: float
    eur_mmstb: float
    field_life_years: float
    anomaly_flags: List[str]

class AssetAnalysisResponse(BaseModel):
    dca_results:Any
    session_id: str

    

@app.post("/api/chat")
async def chat(
    request: Request,
    prompt: Annotated[str, Form()],
    model_id: Annotated[str, Form()],
    session_id: Annotated[str | None, Form()] = None,
) -> ChatResponse:
    """Chat endpoint to interact with the Reservoir Orchestrator."""
    user_id = 'user.email'  
    current_session_id = session_id if session_id else str(uuid.uuid4())
 
    # ADK/LiteLLM logic: Wrap the model ID provided by the user
    # This allows for gemini-2.5-flash, claude-3-5-sonnet, etc.
    try:
        new_model = LiteLlm(model=model_id)
        root_agent.model = new_model
        logger.info(f"Session {current_session_id} using model_id: {model_id}, root_agent_model: {new_model}")
        # Also update sub-agents so the whole "team" uses the selected brain
        #for sub in root_agent.sub_agents:
        #    sub = new_model
            
        logger.info(f"Team re-aligned to model: {model_id}")
    except Exception as e:
        logger.error(f"Failed to load model {model_id} and re-align, falling back to default. Error: {e}")
        root_agent.model = LiteLlm(model="gemini-2.5-flash")

    # Session Management logic...
    session = await _session_service.get_session(session_id=current_session_id, user_id=user_id, app_name=APP_NAME)
    if not session:
        session = await _session_service.create_session(session_id=current_session_id, user_id=user_id, app_name=APP_NAME)

    # Runner initialization...
    runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=_session_service)

    new_message = Content(role="user", parts=[Part(text=prompt)])
    #content = types.Content(role='user', parts=[types.Part(text=query)])
    
    logger.info(f"new_message: {new_message}")
    final_msg = ""
    final_response_text = "Agent did not produce a final response." # Default
    
    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=current_session_id,
            new_message=new_message,
        ):  
            # uncomment the line below to see *all* events during execution
            logger.info(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")
            
            if event.is_final_response():
              if event.content and event.content.parts:
              
                parts = event.content.parts
                logger.info(
                    f"[Event] Author: {event.author} | "
                    f"Type: {type(event).__name__} | "
                    f"Final: {event.is_final_response()} | "
                    f"is_thought={getattr(parts[0], 'thought', 'N/A')} | "
                    f"Main_Text={parts[1].text if len(parts) > 1 else 'N/A'} | "
                    f"CoT_Text={parts[0].text if len(parts) > 0 else 'N/A'}"
                )    
                # Assuming text response in the first part
                # If there are 2 parts, Main_Text is at index [1]
                # If there is only 1 part, Main_Text is at index [0]
                if len(parts) > 1:
                    final_response_text = parts[1].text
                else:
                    final_response_text = parts[0].text
              elif event.actions and event.actions.escalate: # Handle potential errors/escalations
                 final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
              break
        logger.info(f"<<< Agent Response: {final_response_text}")
            

    except Exception as e:
        # This will now catch and log the specific LiteLLM error 
        # while litellm.set_verbose=True shows the outgoing payload
        logger.error(f"CRASH during runner.run_async: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    return ChatResponse(
        response=final_response_text,
        session_id=current_session_id,
        model_id=model_id
    )



@app.post("/api/tools/asset-analysis", response_model=AssetAnalysisResponse)
async def analyze_asset_production(request: AssetAnalysisRequest):
    try:
        # 1. DETERMINISTIC MATH (The "Ground Truth")
        formatted_records = [
            {"well_name": r.well_name, "oil_rates": r.oil_rates} 
            for r in request.records
        ]
        
        dca_results = bulk_dca_analysis(
            production_records=formatted_records,
            econ_limit_stbd=request.econ_limit
        )
        
        # This prevents the "float64 not serializable" crash.
        # We use a trick: JSON dump and reload to force pure Python types.
        safe_dca_results = json.loads(json.dumps(dca_results, default=str))

        # 2. AI INTERPRETATION (The "Consultant Report")
        # We prepare a prompt that includes the raw math results
        summary_for_ai = (
            f"DCA Results: Total EUR {safe_dca_results['total_eur_mmstb']} MMSTB. "
            f"Wells analyzed: {safe_dca_results['wells_analysed']}. "
            f"Anomalies found in: {', '.join(safe_dca_results['wells_near_abandonment'])}."
        )

        prompt = (
            f"You are the Reservoir Production Analyst. Analyze the following DCA results and "
            f"provide a management-ready executive summary. "
            f"Identify intervention candidates and interpret b-factor anomalies.\n\n"
            f"DATA: {summary_for_ai}"
        )

        # 3. CONSTRUCT RESPONSE
        return AssetAnalysisResponse(
            dca_results=safe_dca_results,
            session_id=str(uuid.uuid4()) # Create a session for subsequent follow-up chat
        )

    except Exception as e:
        logger.error(f"Asset Analysis Tool Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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

#  MOUNT THE REPORTING A2A AGENT ---
# This makes the reporting agent discoverable at gcpagent.exzing.com/a2a/reporting
#from agents.reporting.agent import a2a_app
#app.mount("/a2a/reporting", a2a_app)  

# This tells FastAPI: "If the URL starts with /assets, look in the static/assets folder"
static_dir = os.path.join(os.path.dirname(__file__), "static")
assets_dir = os.path.join(static_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# 3. SERVE THE INDEX.HTML FOR THE ROOT
@app.get("/", include_in_schema=False)
async def serve_index():
    return FileResponse(os.path.join(static_dir, "index.html"))


# 2. Serve the React app for the root URL
@app.get("/")
async def serve_spa():
    return FileResponse("static/index.html")

# 3. Handle React Routing (SPA fallback)
# This ensures that if a user refreshes the page on /chat, they don't get a 404
@app.get("/{full_path:path}", include_in_schema=False)
async def catch_all(full_path: str):
    # CRITICAL: If the path starts with a2a, do NOT return index.html
    # This allows the A2A discovery protocol to work.
    if (full_path.startswith("api") or 
        full_path.startswith("health") or 
        full_path.startswith("a2a") or 
        full_path.startswith("_adk") or
        full_path.startswith("docs")):
        return None 
    
    # For everything else, serve the React index.html
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not found. Did you run 'make build-ui'?"}
    
    
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
