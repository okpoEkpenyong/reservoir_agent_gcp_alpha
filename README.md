# Exzing Reservoir Agent — GCP Edition
### Google for Startups AI Agents Challenge 2026 — Track 3: Refactor for Google Cloud Marketplace

**Built by:** Ekpenyong Okpo, CEO & Co-founder, Exzing Technology Ltd. (Lagos, Nigeria)
**Live demo (Azure baseline):** [Microsoft Marketplace](https://marketplace.microsoft.com/en-us/product/okpo-exzing-research.exzing-reservoir-agent)
**Sycophancy Sentry (AI Safety research):** [Live Dashboard](https://ai-sycophancy-sentry.streamlit.app/)

---

## What it does

The Exzing Reservoir Agent is an AI-powered engineering workstation for upstream oil and gas reservoir engineers across Africa. It automates the most time-intensive stages of the Field Development Planning (FDP) lifecycle:

- **Simulation QC** — Quality control of ECLIPSE™ and OPM simulation decks, catching physical anomalies and keyword errors before costly simulator runs
- **Production Analysis** — Arps decline curve analysis (DCA), EUR estimation, and production anomaly detection for African O&G assets
- **RelPerm Generation** — ECLIPSE SWOF/SGOF relative permeability tables using Corey correlations calibrated to Niger Delta analogues
- **Executive Reporting** — Management-ready summaries via A2A protocol, callable by any enterprise system

---

## Track 3 Compliance

| Requirement | Implementation |
|---|---|
| B2B challenge | Reservoir engineering QC for African E&P companies |
| Cloud-native runtime | Google Cloud Run (Dockerfile + cloudbuild.yaml) |
| Gemini exclusively | Gemini 2.0 Flash on all agents via ADK |
| A2A protocol | ReportingAgent exposed via `to_a2a()`, consumed by OrchestratorAgent as `RemoteA2aAgent` |
| ADK orchestration | `google.adk.Agent` + `google.adk.agents.RemoteA2aAgent` |
| Agent Identity | Configured via Cloud Run service accounts + ADK session identity |
| Multi-agent | 4 agents: Orchestrator, SimulationQC, ProductionAnalyst, Reporting |

---

## Architecture

```
User (Streamlit UI)
        │
        ▼
OrchestratorAgent (ADK root · Gemini 2.0 Flash)
        ├──→ SimulationQCAgent    (local sub-agent · ECLIPSE/OPM QC)
        ├──→ ProductionAnalystAgent (local sub-agent · DCA/EUR/RelPerm)
        └──→ ReportingAgent ←──── A2A Protocol ──→ Enterprise ERP/HSE
                                  (remote · uvicorn :8007)

All agents: Gemini 2.5 Flash · Google Cloud Run · Secret Manager
Physics tools: Deterministic (Arps, Corey, Winland R35) — no hallucination risk
```

See `architecture.svg` for the full diagram.

---

## The A2A Story

The **ReportingAgent** runs as a standalone microservice. Any enterprise system — an O&G company's internal ERP, HSE compliance platform, or corporate dashboard — can call it via the A2A protocol to receive management-ready summaries of reservoir engineering analyses.

This enables a B2B integration pattern: African E&P companies can embed Exzing's AI reporting capability into their existing workflows without requiring engineers to use the full workstation.

Agent card auto-generated at: `GET /.well-known/agent-card.json`

---

## For Africa & Beyond

Africa holds ~7% of global proven oil reserves. Nigeria, Angola, Ghana, and Egypt are major exporters.
Yet reservoir engineering workflows on the continent remain heavily dependent on expensive software, and manual, error-prone simulation QC processes.

Exzing is the first African-built AI agent for reservoir engineering on a global enterprise marketplace. 
This GCP edition extends that reach to Google Cloud, doubling distribution and enabling integration with enterprise systems via A2A.

---

## Quick start (local)

```bash
# 1. Clone and install
git clone https://github.com/okpoEkpenyong/reservoir_agent_gcp_alpha.git
cd reservoir_agent_gcp_alpha
pip install -r requirements.txt

# 2. Set environment variables
cp .env.example .env
# Add GOOGLE_API_KEY from https://aistudio.google.com

# 3. Start the A2A Reporting Agent server
uvicorn serve_reporting:app --host localhost --port 8001

# 4. In a new terminal, start the main app
streamlit run main.py
```

---

## Deployment (Cloud Run)

```bash
# Build and deploy via Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly
gcloud run deploy exzing-reservoir-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Mandatory Technologies Used

- **Intelligence:** Gemini 2.0 Flash (`gemini-2.05-flash`) via `google-generativeai` and Vertex AI
- **Orchestration:** Google ADK (`google-adk[a2a]`) — `Agent`, `RemoteA2aAgent`, `to_a2a()`
- **Infrastructure:** Google Cloud Run + Cloud Build + Artifact Registry
- **A2A:** `a2a-sdk` — agent card, `to_a2a()`, `RemoteA2aAgent`
- **Secrets:** Google Secret Manager
- **Safety:** Gemini safety filters + heuristic adversarial pattern detection

---

## File structure

```
reservoir_gcp/
├── agents/
│   ├── orchestrator/agent.py     ← Root ADK agent
│   ├── simulation_qc/agent.py    ← ECLIPSE QC sub-agent
│   ├── production_analyst/agent.py ← DCA/EUR sub-agent
│   └── reporting/agent.py        ← A2A-exposed reporting agent
├── tools/
│   └── reservoir_tools.py        ← Deterministic physics tools
├── agent/
│   ├── llm.py                    ← Multi-provider LLM engine (Gemini primary)
│   └── safety_shields.py         ← GCP Model Armor + heuristic safety
├── main.py                       ← Streamlit UI wired to ADK
├── serve_reporting.py            ← uvicorn A2A server entrypoint
├── Dockerfile                    ← Cloud Run container
├── cloudbuild.yaml               ← CI/CD pipeline
├── architecture.svg              ← System diagram
└── requirements.txt
```

---

## About Exzing Technology Ltd.

Nigerian deep-tech startup building AI tools for African upstream oil and gas.
Previously deployed on **Microsoft Commercial Marketplace** (Azure ISV Success Level 3).
This GCP edition is the cross-cloud expansion.

**Contact:** info@exzing.com | okpo.ekpenyong@gmail.com
