"""
reservoir_tools.py — ADK-compatible function tools for Exzing Reservoir Agent

Each function is a deterministic physics tool registered as an ADK tool.
The LLM (Gemini) reasons over the outputs of these tools — it never
generates raw reservoir engineering numbers from training data alone.

ZDR: All data is processed in-memory. No persistence outside active session.
"""

import re
import json
import logging
import os
import numpy as np
import pandas as pd
from scipy.optimize import curve_fit

logger = logging.getLogger(__name__)

# ── ECLIPSE keyword database ──────────────────────────────────────────────────
# Loads from agents/data/reservoir_keywords_db_v3.json (copied from beta repo).
# Falls back to a hardcoded subset so the tool works even before the data/
# directory is in place — useful during initial repo setup and CI.

_VALID_SECTIONS = {"RUNSPEC", "GRID", "EDIT", "PROPS", "REGIONS",
                   "SOLUTION", "SUMMARY", "SCHEDULE"}

_REQUIRED_SECTIONS = {"RUNSPEC", "GRID", "PROPS", "SOLUTION", "SCHEDULE"}

_FALLBACK_KEYWORDS = _VALID_SECTIONS | {
    "DIMENS", "OIL", "WATER", "GAS", "DISGAS", "VAPOIL",
    "METRIC", "FIELD", "LAB", "NOSIM", "NSTACK",
    "DX", "DY", "DZ", "TOPS", "PORO", "PERMX", "PERMY", "PERMZ",
    "SWOF", "SGOF", "PVTO", "PVTG", "PVDG", "PVTW", "ROCK",
    "DENSITY", "GRAVITY", "EQUIL", "RSVD", "PBVD",
    "WELSPECS", "COMPDAT", "WCONPROD", "WCONINJE",
    "RPTSOL", "RPTRST", "TSTEP", "DATES", "END",
    "INCLUDE", "TITLE", "START",
}


def _load_keyword_db() -> set:
    """
    Load the full ECLIPSE / OPM keyword database from JSON.

    Searches two locations in order:
      1. agents/data/reservoir_keywords_db_v3.json  (relative to repo root)
      2. KEYWORD_DB_PATH env var (override for Cloud Run)
      3. Fallback: hardcoded subset above

    Returns:
        Set of known uppercase keyword strings.
    """
    candidates = [
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "..agents", "data", "reservoir_keywords_db_v3.json",
        ),
        os.environ.get("KEYWORD_DB_PATH", ""),
    ]

    for path in filter(None, candidates):
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                # Handle both dict and list shapes from the beta repo
                if isinstance(data, dict):
                    keywords = set(data.keys())
                elif isinstance(data, list):
                    keywords = {
                        item.get("keyword", "") or item.get("name", "")
                        for item in data if isinstance(item, dict)
                    }
                else:
                    continue

                keywords = {k.upper() for k in keywords if k}
                if len(keywords) > 50:
                    logger.info("Loaded %d ECLIPSE keywords from %s", len(keywords), path)
                    return keywords | _VALID_SECTIONS
            except Exception as exc:
                logger.warning("Could not parse keyword DB at %s: %s", path, exc)

    logger.warning(
        "ECLIPSE keyword DB not found — using %d-keyword fallback. "
        "Copy agents/data/reservoir_keywords_db_v3.json from the beta repo.",
        len(_FALLBACK_KEYWORDS),
    )
    return _FALLBACK_KEYWORDS


# Load once at module import — fast dict lookup at call time
_ALL_KNOWN_KEYWORDS = _load_keyword_db()


# ── ECLIPSE QC Tool ───────────────────────────────────────────────────────────

def qc_eclipse_deck(deck_snippet: str, error_log: str = "") -> dict:
    """
    Quality-control an ECLIPSE or OPM simulation deck snippet.

    Checks for:
    - Presence of required sections (RUNSPEC, GRID, PROPS, SOLUTION, SCHEDULE)
    - Keyword spelling against full database (agent/data/reservoir_keywords_db_v3.json)
    - Physical anomalies (negative permeability, impossible saturations)
    - Error log cross-reference if provided

    Args:
        deck_snippet: The .DATA deck content to analyse.
        error_log: Optional simulator error log (enables debug mode).

    Returns:
        dict with keys: issues (list), missing_sections (list),
        unknown_keywords (list), safety_score (int), mode (str),
        issue_count (int), keyword_db_size (int).
    """
    issues = []
    unknown_keywords = []

    # 1. Section check
    found_sections = {s for s in _VALID_SECTIONS if s in deck_snippet.upper()}
    missing_sections = list(_REQUIRED_SECTIONS - found_sections)
    if missing_sections:
        issues.append(f"Missing required sections: {', '.join(sorted(missing_sections))}")

    # 2. Keyword validation against full DB
    candidate_keywords = re.findall(r"\b[A-Z]{4,12}\b", deck_snippet)
    for kw in set(candidate_keywords):
        if kw not in _ALL_KNOWN_KEYWORDS:
            unknown_keywords.append(kw)
            issues.append(f"Unrecognised keyword: {kw}")

    # 3. Physical anomaly checks
    if re.search(r"PERMX\s+-\d", deck_snippet):
        issues.append("CRITICAL: Negative PERMX value — physically impossible.")

    if re.search(r"PERMY\s+-\d", deck_snippet):
        issues.append("CRITICAL: Negative PERMY value — physically impossible.")

    poro_vals = re.findall(r"PORO\s+([\d.]+)", deck_snippet)
    for v in poro_vals:
        if float(v) > 0.45:
            issues.append(f"WARNING: Porosity {v} > 0.45 — geologically unrealistic.")
        if float(v) <= 0:
            issues.append(f"CRITICAL: Porosity {v} <= 0 — will cause simulator abort.")

    # 4. Error log cross-reference
    mode = "QC"
    if error_log.strip():
        mode = "DEBUG"
        el = error_log.upper()
        if "RUNSPEC" in el:
            issues.append("Error log references RUNSPEC — check DIMENS keyword and section order.")
        if "NEGATIVE" in el or "OVERFLOW" in el:
            issues.append("Numerical instability in error log — check TSTEP sizing and CFL conditions.")
        if "UNDEFINED" in el:
            issues.append("Undefined keyword in error log — cross-check against keyword database.")
        if "MEMORY" in el:
            issues.append("Memory error in log — check NSTACK and DIMENS dimensions.")

    safety_score = max(100 - len(issues) * 15, 10)

    return {
        "mode": mode,
        "issues": issues,
        "missing_sections": missing_sections,
        "unknown_keywords": unknown_keywords,
        "safety_score": safety_score,
        "issue_count": len(issues),
        "keyword_db_size": len(_ALL_KNOWN_KEYWORDS),
    }


# ── DCA / EUR Tools ───────────────────────────────────────────────────────────

def _arps_hyperbolic(t, qi, di, b):
    """Arps hyperbolic decline equation (Arps, 1945)."""
    return qi / (1.0 + b * di * t) ** (1.0 / b)


def fit_decline_curve(
    oil_rates: list,
    well_name: str = "WELL-1",
    econ_limit_stbd: float = 50.0,
) -> dict:
    """
    Fit Arps decline curve to production history and estimate EUR.

    Implements the Arps (1945) hyperbolic decline model:
        q(t) = qi / (1 + b * Di * t)^(1/b)

    Args:
        oil_rates: List of monthly oil production rates in STB/D,
                   ordered from oldest to most recent.
        well_name: Well identifier for reporting.
        econ_limit_stbd: Economic limit rate in STB/D (SPE-PRMS §3.4).

    Returns:
        dict with qi_stbd, di_per_yr, b_factor, eur_mmstb,
        field_life_years, current_rate_stbd, anomaly_flags (list),
        well_name, spe_prms_note (str).

    References:
        Arps, J.J. (1945). Analysis of Decline Curves. Trans. AIME, 160, 228-247.
        SPE-PRMS (2018) §3.4 — Decline Curve Analysis methodology.
    """
    rates = np.array(oil_rates, dtype=float)
    t = np.arange(len(rates), dtype=float)
    anomaly_flags = []

    # Fit Arps hyperbolic
    try:
        popt, _ = curve_fit(
            _arps_hyperbolic, t, rates,
            p0=[max(rates), 0.1, 0.5],
            bounds=(0, [np.inf, 1.0, 2.0]),
            maxfev=5000,
        )
        qi, di, b = float(popt[0]), float(popt[1]), float(popt[2])
    except Exception:
        # Fallback — exponential with initial rate
        qi, di, b = float(rates[0]), 0.125, 0.0

    # EUR: integrate to economic limit
    if b < 0.01:
        t_econ = np.log(max(qi / max(econ_limit_stbd, 1), 1e-9)) / max(di, 1e-9)
    else:
        t_econ = (((qi / max(econ_limit_stbd, 1)) ** b) - 1.0) / (b * max(di, 1e-9))

    t_forecast = np.linspace(0, min(t_econ, 240), 500)  # cap at 20 years
    q_forecast = _arps_hyperbolic(t_forecast, qi, di, b) if b > 0.01 else qi * np.exp(-di * t_forecast)
    eur_stb = float(np.trapezoid(np.maximum(q_forecast, 0), t_forecast) * 30.4)
    eur_mmstb = round(eur_stb / 1e6, 3)
    field_life_years = round(min(t_econ, 240) / 12, 1)

    # Anomaly flags
    spe_note = "Standard SPE-PRMS §3.4 hyperbolic decline — suitable for 1P/2P/3P booking."
    if b > 1.0:
        anomaly_flags.append(
            f"b-factor {b:.3f} > 1.0 — transient flow, natural fractures, or pressure support. "
            "Apply terminal exponential switch before booking proved (1P) reserves per SPE-PRMS §3.4."
        )
        spe_note = "WARNING: b > 1.0 — terminal exponential correction required for 1P reserves."
    if di * 100 > 30:
        anomaly_flags.append(
            f"Decline rate {di*100:.1f}%/yr exceeds 30% threshold — assess artificial lift or stimulation."
        )
    if rates[-1] < econ_limit_stbd * 1.5:
        anomaly_flags.append(
            f"Current rate {rates[-1]:.0f} STB/D within 1.5x of economic limit "
            f"({econ_limit_stbd:.0f} STB/D) — P&A candidate, schedule workover review."
        )

    return {
        "well_name": well_name,
        "qi_stbd": round(qi, 1),
        "di_per_yr": round(di * 100, 2),
        "b_factor": round(b, 3),
        "eur_mmstb": eur_mmstb,
        "field_life_years": field_life_years,
        "current_rate_stbd": round(float(rates[-1]), 1),
        "anomaly_flags": anomaly_flags,
        "spe_prms_note": spe_note,
    }


def bulk_dca_analysis(
    production_records: list,
    econ_limit_stbd: float = 50.0,
) -> dict:
    """
    Run Arps decline curve analysis on multiple wells in bulk.

    Args:
        production_records: List of dicts, each with:
            - 'well_name' (str): well identifier
            - 'oil_rates' (list[float]): monthly STB/D values, oldest first
        econ_limit_stbd: Economic limit in STB/D.

    Returns:
        dict with well_results (list), total_eur_mmstb (float),
        wells_near_abandonment (list), wells_analysed (int),
        b_flag_count (int — wells with b > 1.0 requiring SPE-PRMS correction).
    """
    results = []
    for record in production_records:
        result = fit_decline_curve(
            oil_rates=record.get("oil_rates", []),
            well_name=record.get("well_name", "UNKNOWN"),
            econ_limit_stbd=econ_limit_stbd,
        )
        results.append(result)

    total_eur = sum(r["eur_mmstb"] for r in results)
    abandonment_candidates = [r["well_name"] for r in results if r["anomaly_flags"]]
    b_flag_count = sum(1 for r in results if r["b_factor"] > 1.0)

    return {
        "well_results": results,
        "total_eur_mmstb": round(total_eur, 3),
        "wells_near_abandonment": abandonment_candidates,
        "wells_analysed": len(results),
        "b_flag_count": b_flag_count,
    }


# ── RelPerm Tool ──────────────────────────────────────────────────────────────

def generate_swof_table(
    swc: float = 0.22,
    sorw: float = 0.18,
    nw: float = 2.8,
    no: float = 3.5,
    krw_max: float = 0.45,
    kro_max: float = 0.92,
    analogue: str = "Niger Delta Shallow Marine",
    n_points: int = 25,
) -> dict:
    """
    Generate an ECLIPSE SWOF relative permeability table using Corey correlations.

    Implements the Corey (1954) correlation:
        Krw(Sw) = Krw_max * ((Sw - Swc) / (1 - Sorw - Swc))^nw
        Kro(Sw) = Kro_max * (1 - (Sw - Swc) / (1 - Sorw - Swc))^no

    Niger Delta analogues calibrated from:
        Doust & Omatsola (1990), AAPG Memoir 48.
        Schlumberger SPWLA Niger Delta Workshop (2009).

    Args:
        swc:      Connate water saturation (irreducible).
        sorw:     Residual oil saturation to waterflood.
        nw:       Water Corey exponent (controls Krw curvature).
        no:       Oil Corey exponent (controls Kro curvature).
        krw_max:  End-point Krw at (1 - Sorw).
        kro_max:  End-point Kro at Swc.
        analogue: Name of Niger Delta depositional analogue.
        n_points: Number of saturation table points.

    Returns:
        dict with eclipse_syntax (str), crossover_sw (float),
        table_csv (str), analogue (str), parameters (dict),
        consistency_check (str).
    """
    # Validate inputs
    if 1.0 - sorw - swc <= 0:
        return {"error": f"Invalid saturations: (1 - Sorw - Swc) = {1-sorw-swc:.3f} must be > 0."}

    sw = np.linspace(swc, 1.0 - sorw, n_points)
    sw_norm = np.clip((sw - swc) / (1.0 - sorw - swc), 0.0, 1.0)
    krw = krw_max * sw_norm ** nw
    kro = kro_max * (1.0 - sw_norm) ** no

    # Crossover Sw
    cross_idx = int(np.argmin(np.abs(krw - kro)))
    crossover_sw = float(sw[cross_idx])

    # ECLIPSE SWOF syntax
    header = (
        f"-- SWOF table — Exzing Reservoir Agent (Alpha / GCP Edition)\n"
        f"-- Analogue : {analogue}\n"
        f"-- Swc={swc}  Sorw={sorw}  nw={nw}  no={no}\n"
        f"-- Krw_max={krw_max}  Kro_max={kro_max}\n"
        f"-- Generated by tools/reservoir_tools.py\n"
        f"SWOF\n"
    )
    rows = "".join(
        f"  {sw[i]:.6f}    {krw[i]:.6f}    {kro[i]:.6f}    0.0000\n"
        for i in range(n_points)
    )
    eclipse_syntax = header + rows + "/\n"

    # CSV for export / data analysis
    df = pd.DataFrame({"Sw": sw, "Krw": krw, "Kro": kro, "Pc": np.zeros(n_points)})
    table_csv = df.to_csv(index=False)

    # Consistency check
    consistency = "PASS"
    if krw_max > kro_max * 1.5:
        consistency = "WARNING: Krw_max unusually high relative to Kro_max — verify wettability."
    if nw > 5.0 or no > 6.0:
        consistency = "WARNING: Corey exponents very high — typical range nw 1-4, no 1-5."

    return {
        "analogue": analogue,
        "eclipse_syntax": eclipse_syntax,
        "crossover_sw": round(crossover_sw, 4),
        "table_csv": table_csv,
        "consistency_check": consistency,
        "parameters": {
            "swc": swc, "sorw": sorw,
            "nw": nw, "no": no,
            "krw_max": krw_max, "kro_max": kro_max,
        },
    }


# ── Reporting / Context Formatter ─────────────────────────────────────────────

def format_engineering_context(
    qc_result: dict = None,
    dca_result: dict = None,
    relperm_result: dict = None,
) -> str:
    """
    Format structured tool outputs into a clean engineering context string
    for Gemini to generate a management-ready executive summary.

    Called by the ReportingAgent (A2A) before generating board-level reports.

    Args:
        qc_result:      Output from qc_eclipse_deck().
        dca_result:     Output from bulk_dca_analysis().
        relperm_result: Output from generate_swof_table().

    Returns:
        Formatted string suitable for a Gemini summarisation prompt.
        Returns a placeholder if no data is provided.
    """
    sections = []

    if qc_result:
        sections.append(
            f"=== SIMULATION QC RESULTS ===\n"
            f"Mode         : {qc_result.get('mode', 'QC')}\n"
            f"Safety Score : {qc_result.get('safety_score')}%\n"
            f"Issue Count  : {qc_result.get('issue_count', 0)}\n"
            f"Issues       : {'; '.join(qc_result.get('issues', [])) or 'None detected'}\n"
            f"Missing Secs : {qc_result.get('missing_sections') or 'None'}\n"
            f"Unknown KWs  : {qc_result.get('unknown_keywords') or 'None'}\n"
            f"Keyword DB   : {qc_result.get('keyword_db_size', 'unknown')} keywords"
        )

    if dca_result:
        well_lines = "\n".join(
            f"  {w['well_name']}: qi={w['qi_stbd']} STB/D  Di={w['di_per_yr']}%/yr  "
            f"b={w['b_factor']}  EUR={w['eur_mmstb']} MMSTB  "
            f"Life={w['field_life_years']} yrs"
            for w in dca_result.get("well_results", [])
        )
        sections.append(
            f"=== PRODUCTION ANALYSIS (DCA) ===\n"
            f"Wells Analysed       : {dca_result.get('wells_analysed')}\n"
            f"Total Field EUR      : {dca_result.get('total_eur_mmstb')} MMSTB\n"
            f"b>1 Wells (SPE flag) : {dca_result.get('b_flag_count', 0)}\n"
            f"Abandonment Cands    : {dca_result.get('wells_near_abandonment') or 'None'}\n"
            f"Well Detail:\n{well_lines}"
        )

    if relperm_result:
        p = relperm_result.get("parameters", {})
        sections.append(
            f"=== RELATIVE PERMEABILITY ===\n"
            f"Analogue      : {relperm_result.get('analogue')}\n"
            f"Crossover Sw  : {relperm_result.get('crossover_sw')}\n"
            f"Consistency   : {relperm_result.get('consistency_check', 'PASS')}\n"
            f"Parameters    : Swc={p.get('swc')}  Sorw={p.get('sorw')}  "
            f"nw={p.get('nw')}  no={p.get('no')}  "
            f"Krw_max={p.get('krw_max')}  Kro_max={p.get('kro_max')}"
        )

    if not sections:
        return "No engineering data provided — please run QC, DCA, or RelPerm analysis first."

    return "\n\n".join(sections)



# 3. Example of an A2A Trigger (Logic for your /api/chat route)
# When the orchestrator decides it's time for a report, it "hands off" to the reporter
async def handle_reporting_handoff(root_agent, result_summary: str):
    # This simulates the Orchestrator calling the Reporting Agent via A2A
    response = await root_agent.call_agent(
        agent_name="exzing_reporting_agent",
        message=f"Please create an executive report for these results: {result_summary}"
    )
    return response