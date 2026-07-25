# run_benchmark.py

"""
Deliberate, manually-triggered benchmark run.
Not called by live user traffic — run this on a fixed, representative
set of ECLIPSE/OPM decks to produce defensible before/after evidence.

Usage:
    python run_benchmark.py
"""

import json
from pathlib import Path

from tools.benchmark_metrics import BenchmarkLogger, BenchmarkTimer, RunMode, summarize
from agents.simulation_qc.agent import run_qc_check  # adjust import to your actual entrypoint

BENCHMARK_DECKS_DIR = Path("benchmark_decks")  # place 5-10 representative decks here
LOGGER = BenchmarkLogger()


def run_manual_baseline(deck_path: Path) -> None:
    """
    Placeholder for manual/baseline timing.
    In practice this number comes from timed, real manual QC sessions
    logged separately (e.g. an engineer manually reviewing the deck
    with a stopwatch) — record those results here for comparison.
    """
    # Example of manually recording a known baseline time and error count:
    with BenchmarkTimer(deck_path.name, RunMode.MANUAL_BASELINE, LOGGER,
                         notes="Manually timed baseline, see field notes") as t:
        # If you already know the manual time/errors from a real session,
        # you can skip the timer and construct a BenchmarkResult directly instead.
        pass


def run_agent_assisted(deck_path: Path) -> None:
    with BenchmarkTimer(deck_path.name, RunMode.AGENT_ASSISTED, LOGGER) as t:
        result = run_qc_check(str(deck_path))  # adjust to your actual agent call
        for error in result.get("errors", []):
            t.record_error(error)


def main():
    decks = sorted(BENCHMARK_DECKS_DIR.glob("*.DATA"))  # adjust extension as needed
    if not decks:
        print(f"No benchmark decks found in {BENCHMARK_DECKS_DIR}/")
        return

    for deck in decks:
        print(f"Running agent-assisted QC on {deck.name}...")
        run_agent_assisted(deck)

    records = LOGGER.load_all()
    summary = summarize(records)
    print(json.dumps(summary, indent=2))

    with open("benchmark_summary.json", "w") as f:
        json.dump(summary, f, indent=2)


if __name__ == "__main__":
    main()