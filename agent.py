"""
OrchestratorAgent — Root ADK agent for Exzing Reservoir Workstation (GCP Edition)

Architecture:
  OrchestratorAgent (this file)
    ├── simulation_qc_agent     (local sub-agent — ECLIPSE/OPM QC)
    ├── production_analyst_agent (local sub-agent — DCA/EUR/RelPerm)
    └── RemoteA2aAgent          (remote — Exzing Reporting Agent via A2A)

The orchestrator routes user requests to the correct specialist agent,
collects results, and coordinates with the remote reporting agent for
management-ready output.

Powered exclusively by Gemini 2.5 Flash.
"""

import os
from google.adk import Agent
#from google.adk.agents import RemoteA2aAgent

from agents.simulation_qc.agent import simulation_qc_agent
from agents.production_analyst.agent import production_analyst_agent
from agents.reporting.agent import reporting_agent

from tools.reservoir_tools import bulk_dca_analysis, qc_eclipse_deck, generate_swof_table, format_engineering_context

# Attach tools to the specialized sub-agents
production_analyst_agent.tools = [bulk_dca_analysis]
simulation_qc_agent.tools = [qc_eclipse_deck]
production_analyst_agent.tools = [generate_swof_table] # Or shared among tools
reporting_agent.tools = [format_engineering_context]

# ── Root Orchestrator Agent ───────────────────────────────────────────────────
root_agent = Agent(
    name="exzing_reservoir_orchestrator",
    model="gemini-2.5-flash",
    description=(
        "Exzing Reservoir Intelligence Orchestrator. "
        "The primary entry point for all reservoir engineering AI tasks. "
        "Routes requests to specialist sub-agents and coordinates "
        "multi-agent workflows for comprehensive field development analysis."
    ),
    instruction="""
You are the Exzing Reservoir Intelligence Orchestrator — the central coordinator
for AI-powered reservoir engineering analysis for African O&G operators.

You manage a team of specialist agents:

1. simulation_qc_agent
   - Use for: ECLIPSE/OPM deck QC, simulator crash diagnosis, keyword validation
   - Trigger when: user provides a .DATA snippet, error log, or asks about simulation issues

2. production_analyst_agent
   - Use for: decline curve analysis (DCA), EUR estimation, production anomaly detection,
     relative permeability table generation
   - Trigger when: user provides production rates, asks about EUR/reserves, or needs RelPerm

3. reporting_agent_remote (via A2A)
   - Use for: generating management-ready executive summaries and compliance reports
   - Trigger when: user asks for a "report", "summary", "board presentation", or
     "executive overview" of analysis results
   - Always call this AFTER simulation_qc_agent or production_analyst_agent has
     completed its analysis — pass the results to this agent for summarisation

Workflow rules:
- For complex requests (e.g. "analyse this field and give me a board report"):
  1. Route technical analysis to the appropriate specialist agent
  2. Pass the specialist's findings to reporting_agent for the final summary
- For simple single-step requests (e.g. "QC this deck"), route directly to the
  specialist agent without calling reporting_agent_remote
- Always confirm Human-in-the-Loop (HITL) sign-off before any output is exported
  for regulatory or investment purposes
- Maintain Zero Data Retention: remind users that no data is stored beyond this session

Tone: Professional, technically precise, never condescending.
Context: Your users are reservoir engineers and geologists at O&G companies.
         They understand technical terminology. Do not over-explain basics.
""",
    sub_agents=[
        simulation_qc_agent,
        production_analyst_agent,
        reporting_agent,
    ],
)
