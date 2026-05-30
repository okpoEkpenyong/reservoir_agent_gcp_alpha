"""
serve_reporting.py — Starts the Exzing Reporting Agent as an A2A server.

Usage (local):
    uvicorn serve_reporting:app --host localhost --port 8001

Usage (Cloud Run):
    Set PORT env var — Cloud Run injects this automatically.
    The Dockerfile CMD handles this.

The Reporting Agent is a standalone microservice that enterprise clients
(ERP systems, corporate dashboards, HSE platforms) can call via A2A
to receive management-ready reservoir engineering reports.
"""

import os
import sys

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.reporting.agent import a2a_app as app  # noqa: E402

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(
        "serve_reporting:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
    )
