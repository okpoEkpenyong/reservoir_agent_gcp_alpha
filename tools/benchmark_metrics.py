# tools/benchmark_metrics.py

"""
Benchmark evidence pipeline for the Exzing Reservoir Agent.

Measures QC time and error-detection rate on a fixed set of representative
ECLIPSE/OPM decks, comparing a manual/baseline pass against the
SimulationQCAgent-assisted pass.

This is NOT wired into live user traffic. Run deliberately via run_benchmark.py,
on a small, fixed benchmark suite, to produce a defensible, repeatable
efficiency comparison.
"""

import time
import json
import uuid
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Optional


class RunMode(str, Enum):
    MANUAL_BASELINE = "manual_baseline"
    AGENT_ASSISTED = "agent_assisted"


@dataclass
class BenchmarkResult:
    run_id: str
    deck_name: str
    mode: RunMode
    duration_seconds: float
    errors_caught: int
    errors_detail: list[str] = field(default_factory=list)
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    notes: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["mode"] = self.mode.value
        return d


class BenchmarkLogger:
    """
    Appends benchmark results to a local JSONL store.
    Swap `_write` for a Cloud Storage / Firestore write if you want
    results centrally aggregated across environments.
    """

    def __init__(self, log_path: str = "benchmark_runs.jsonl"):
        self.log_path = Path(log_path)

    def log(self, result: BenchmarkResult) -> None:
        self._write(result.to_dict())

    def _write(self, record: dict) -> None:
        with self.log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

    def load_all(self) -> list[dict]:
        if not self.log_path.exists():
            return []
        with self.log_path.open("r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]


class BenchmarkTimer:
    """Context manager for timing a QC pass, manual or agent-assisted."""

    def __init__(
        self,
        deck_name: str,
        mode: RunMode,
        logger: BenchmarkLogger,
        notes: Optional[str] = None,
    ):
        self.deck_name = deck_name
        self.mode = mode
        self.logger = logger
        self.notes = notes
        self._start: float = 0.0
        self.errors_caught: int = 0
        self.errors_detail: list[str] = []

    def __enter__(self) -> "BenchmarkTimer":
        self._start = time.perf_counter()
        return self

    def record_error(self, description: str) -> None:
        """Call this each time the QC pass (manual or agent) flags an issue."""
        self.errors_detail.append(description)
        self.errors_caught += 1

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        duration = time.perf_counter() - self._start
        result = BenchmarkResult(
            run_id=str(uuid.uuid4()),
            deck_name=self.deck_name,
            mode=self.mode,
            duration_seconds=round(duration, 3),
            errors_caught=self.errors_caught,
            errors_detail=self.errors_detail,
            notes=self.notes,
        )
        self.logger.log(result)


def summarize(records: list[dict]) -> dict:
    """
    Aggregate benchmark records into a comparison summary:
    average duration and error detection rate per mode.
    """
    summary: dict[str, dict] = {}
    for mode in (RunMode.MANUAL_BASELINE.value, RunMode.AGENT_ASSISTED.value):
        mode_records = [r for r in records if r["mode"] == mode]
        if not mode_records:
            summary[mode] = {"count": 0}
            continue
        durations = [r["duration_seconds"] for r in mode_records]
        errors = [r["errors_caught"] for r in mode_records]
        summary[mode] = {
            "count": len(mode_records),
            "avg_duration_seconds": round(sum(durations) / len(durations), 2),
            "avg_errors_caught": round(sum(errors) / len(errors), 2),
            "total_errors_caught": sum(errors),
        }

    manual = summary.get(RunMode.MANUAL_BASELINE.value, {})
    agent = summary.get(RunMode.AGENT_ASSISTED.value, {})
    if manual.get("avg_duration_seconds") and agent.get("avg_duration_seconds"):
        speedup = manual["avg_duration_seconds"] / agent["avg_duration_seconds"]
        summary["speedup_factor"] = round(speedup, 2)

    return summary