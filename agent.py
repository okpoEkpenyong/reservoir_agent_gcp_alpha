
"""
Exzing Reservoir Orchestrator — Enterprise A2A Edition (Track 3)

Architecture:
  Exzing Orchestrator (Root Agent)
    ├── Local Specialists:
    │   ├── simulation_qc_agent      (Internal — ECLIPSE/OPM Syntax & QC)
    │   └── production_analyst_agent  (Internal — Physics-Grounded DCA & EUR Math)
    └── Remote A2A Services (Marketplace-Ready):
        ├── exzing_reporting_agent    (Remote A2A — SPE-PRMS Executive Reporting)
        └── corporate_facility_agent  (Remote A2A — Building Logistics & HVAC Optimization)

Description:
  This orchestrator serves as the 'Concierge' for the Exzing ecosystem. Following 
  Google's A2A protocol, it decouples engineering logic from enterprise services. 
  
  B2B Interoperability Case:
  Demonstrates seamless coordination between an Energy Agent and a Corporate HR/Facility 
  Agent to anticipate building occupancy spikes during technical reviews, enabling 
  proactive war-room booking and pre-cooling (HVAC) optimization.

Intelligence: 
  Powered by Gemini 2.0/2.5 reasoning engines via Vertex AI.
  Refactored for Google Cloud Marketplace and Enterprise interoperability.
"""

import os
#from google.adk import Agent
from google.adk.agents.llm_agent import Agent
from google.genai import types

# 1. IMPORT REMOTE A2A LOGIC
from google.adk.agents.remote_a2a_agent import AGENT_CARD_WELL_KNOWN_PATH
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

from google.adk.auth.credential_manager import CredentialManager
from google.adk.integrations.agent_identity import GcpAuthProvider, GcpAuthProviderScheme

# 2. LOCAL TECHNICAL AGENTS (These stay local for performance)
from agents.simulation_qc.agent import simulation_qc_agent
from agents.production_analyst.agent import production_analyst_agent
#from agents.reporting.agent import reporting_agent

from google.adk.tools import google_search

from tools.reservoir_tools import bulk_dca_analysis, qc_eclipse_deck, generate_swof_table, format_engineering_context


# --- 1. AGENT IDENTITY REGISTRATION ---
# Register the official Google Cloud Auth Provider
CredentialManager.register_auth_provider(GcpAuthProvider())

# Attach tools to the specialized sub-agents
production_analyst_agent.tools = [bulk_dca_analysis]
simulation_qc_agent.tools = [qc_eclipse_deck]
production_analyst_agent.tools = [generate_swof_table] # Or shared among tools
#reporting_agent.tools = [format_engineering_context]


# 3. REMOTE ENTERPRISE AGENTS (The A2A Story)
# We define these via URLs to prove Interoperability
REPORTING_URL = os.getenv("REPORTING_URL", "http://localhost:8007")
FACILITY_URL = os.getenv("FACILITY_URL", "http://localhost:8008")

# The callback URI on your live domain
CONTINUE_URI = "https://gcpagent.exzing.com/validateAgentIdentity"

# Fetch project details from environment (set in your cloudbuild.yaml)
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "fire-victory--a1")
LOCATION = os.getenv("GOOGLE_LOCATION", "us-central1")

# Create the formal Auth Scheme. 
# This resource name represents our Agent's 'Passport' in GCP.
auth_scheme = GcpAuthProviderScheme(
    name=f"projects/{PROJECT_ID}/locations/{LOCATION}/connectors/exzing-orchestrator-identity",
    continue_uri=CONTINUE_URI
)

# Reporting Agent (Your Internal Service)
reporting_agent_remote = RemoteA2aAgent(
    name="exzing_reporting_agent",
    description="Enterprise specialist for SPE-PRMS reporting and executive summaries.",
    agent_card=f"{REPORTING_URL}/a2a/reporting{AGENT_CARD_WELL_KNOWN_PATH}",
    use_legacy=False
)

# Corporate Facility Agent (The "Challenge" Use Case)
corporate_facility_agent = RemoteA2aAgent(
    name="corporate_facility_manager",
    description="Enterprise agent for building logistics, occupancy spikes, and HVAC.",
    agent_card=f"{FACILITY_URL}/a2a/corporate_facility_agent{AGENT_CARD_WELL_KNOWN_PATH}",
    use_legacy=False
)

# 4. ROOT ORCHESTRATOR
root_agent = Agent(
    name="exzing_reservoir_orchestrator",
    model="gemini-2.0-flash",
    description="Exzing Reservoir Intelligence Orchestrator — Central B2B Coordinator.",
    # SECURE BY DESIGN: Inject the auth scheme directly into the agent
    instruction="""
You are the Exzing Reservoir Intelligence Orchestrator — the central coordinator
for AI-powered reservoir engineering analysis for African O&G operators.
Your actions are governed by your GCP Agent Identity.
When calling remote A2A services, you use your cryptographic connector 
to authenticate and verify your 'Secure by Design' status.

You manage a team of local specialist agents and remote enterprise agents:

--- LOCAL SPECIALISTS ---
1. simulation_qc_agent: Use for ECLIPSE/OPM deck syntax and simulator crashes.
2. production_analyst_agent: Use for DCA math, EUR estimates, and RelPerm generation.

--- REMOTE A2A SERVICES ---
3. exzing_reporting_agent: 
   - Use for: Management summaries and SPE-PRMS compliance.
   - Trigger: After a technical analysis is done, hand off to this agent to create a 'Board Report'.

4. corporate_facility_manager:
   - Use for: Boardroom bookings and pre-cooling for technical reviews.
   - Trigger: When a user schedules a 'Simulation Review' or needs a 'War Room'.
   - Context: Anticipate occupancy spikes during these meetings and ask this agent to 'pre-cool' the room.

WORKFLOW:
1. Handle the technical request via a local specialist.
2. Coordinate the business output via the reporting_agent.
3. Coordinate the logistics (Room/HVAC) via the corporate_facility_manager.

Zero Data Retention: No data is stored beyond this session.
""",
    sub_agents=[
        simulation_qc_agent,
        production_analyst_agent,
        reporting_agent_remote,    # Now a Remote Agent
        corporate_facility_agent   # The Challenge-required A2A Agent
    ],
    tools=[google_search],
    generate_content_config=types.GenerateContentConfig(
        safety_settings=[
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
        ]
    ),
)