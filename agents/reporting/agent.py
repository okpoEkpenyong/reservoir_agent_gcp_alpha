"""
ReportingAgent — ADK agent exposed as an A2A service.

This agent runs as a standalone microservice on Cloud Run (port 8007).
Any enterprise system — internal ERPs, HSE platforms, corporate dashboards —
can call this agent via the A2A protocol to receive management-ready
executive summaries of reservoir engineering analyses.

This is the B2B interoperability story: an O&G company's internal
reporting agent can call the Exzing Reporting Agent to transform raw
engineering data into board-ready summaries, without requiring access
to the full reservoir engineering workstation.

Powered exclusively by Gemini 2.5 Flash and other user-selected models.
Exposed via: to_a2a(reporting_agent, port=8007)
"""

from google.adk import Agent
from google.adk.a2a.utils.agent_to_a2a import to_a2a
from a2a.types import AgentCard, AgentSkill, AgentCapabilities

from tools.reservoir_tools import format_engineering_context

# ── Agent definition ──────────────────────────────────────────────────────────
reporting_agent = Agent(
    name="exzing_reporting_agent",
    model="gemini-2.5-flash", # this should be dynamically passed through a Provider coming from App.tx
    description=(
        "Exzing Executive Reporting Agent. "
        "Transforms raw reservoir engineering analysis data into "
        "management-ready executive summaries, board reports, and "
        "HSE compliance statements for African O&G operations. "
        "Accepts structured engineering context via A2A protocol. "
        "Returns professional narrative reports suitable for "
        "C-suite, investors, and regulatory bodies."
    ),
    instruction="""
You are the Executive Reporting Specialist for Exzing Technology Ltd.

Your role is to transform technical reservoir engineering outputs into
clear, professional, management-ready reports for African O&G operators.

When given engineering context (QC results, DCA data, RelPerm analysis):

1. Call format_engineering_context() to structure the raw data.
2. Generate an executive summary with these sections:
   - OPERATIONAL STATUS: One-paragraph summary of current field/asset status.
   - KEY FINDINGS: Three bullet points — most critical findings only.
   - RISK FLAGS: Any anomalies requiring immediate management attention.
   - RECOMMENDATIONS: Specific, actionable next steps with timelines.
   - COMPLIANCE NOTE: SPE-PRMS and applicable regulatory references.

Tone: Professional, concise, non-technical language where possible.
Length: Executive summary should be readable in under 3 minutes.
Audience: Asset managers, VP Engineering, Board members, NUPRC regulators.

Critical rules:
- Never fabricate data. Only report what the engineering tools found.
- Flag any data gaps explicitly rather than filling with assumptions.
- All reserve estimates must state confidence level (1P/2P/3P).
- Include a HITL disclaimer: "This report requires sign-off by a
  qualified reservoir engineer before regulatory submission."
- Zero Data Retention: report content is generated in-memory only.
""",
    tools=[format_engineering_context],
)

# ── A2A Agent Card ────────────────────────────────────────────────────────────
# Explicit agent card for enterprise discovery and integration
_agent_card = AgentCard(
    name="Exzing Executive Reporting Agent",
    #url="https://gcpagent.exzing.com/a2a/reporting",
    url="http://localhost:8001/a2a/reporting",
    description=(
        "Transforms reservoir engineering analysis outputs into "
        "management-ready executive summaries for African O&G operators. "
        "Integrates with corporate ERP, HSE, and reporting systems via A2A."
    ),
    version="1.0.0",
    capabilities=AgentCapabilities(streaming=False),
    skills=[
        AgentSkill(
            id="executive-summary",
            name="Executive Summary Generation",
            description=(
                "Generates board-ready executive summaries from reservoir "
                "engineering QC, DCA, and RelPerm analysis data."
            ),
            tags=["reservoir-engineering", "reporting", "oil-gas", "africa"],
            examples=[
                "Generate an executive summary for SPDC Asset-7 Q2 2026 analysis",
                "Create a management report for the Volve field DCA results",
                "Summarise simulation QC findings for VP Engineering review",
            ],
        ),
        AgentSkill(
            id="compliance-report",
            name="SPE-PRMS Compliance Report",
            description=(
                "Generates SPE-PRMS (2018) compliant reserves statements "
                "and DPR Nigeria regulatory summaries."
            ),
            tags=["spe-prms", "reserves", "compliance", "nigeria", "dpr"],
            examples=[
                "Generate a 1P reserves statement for Field-X",
                "Prepare NUPRC annual production report for Block OML-123",
            ],
        ),
    ],
    default_input_modes=["text/plain"],
    default_output_modes=["text/plain"],
    supports_authenticated_extended_card=False,
)

# ── A2A server application (served via uvicorn) ───────────────────────────────
# Start with: uvicorn agents.reporting.agent:a2a_app --host 0.0.0.0 --port 8007
a2a_app = to_a2a(reporting_agent, port=8007, agent_card=_agent_card) # a2a_app must be served via a different port from the consuming agent (8001)
