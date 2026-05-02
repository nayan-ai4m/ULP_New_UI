"""QuestDB connection + row-shaping helpers.

QuestDB is the live data source (ms_data, sec_data, seal_index_log,
mae_values, leakage_*_config, tqi_log).  Accessed via the Postgres
wire protocol on port 8812 using psycopg2.
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np
import psycopg2
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from scipy.signal import savgol_filter

from config import DATA_DB
from core.circuit_breaker import quest_breaker
from core.errors import error_response, req_id

logger = logging.getLogger("backend.quest")

# ---------------------------------------------------------------------------
# Connection management
# ---------------------------------------------------------------------------

_quest_conn = None


def get_quest():
    """Lazy QuestDB pgwire connection. Reconnect on close."""
    global _quest_conn
    if _quest_conn is None or _quest_conn.closed:
        _quest_conn = psycopg2.connect(**DATA_DB)
    return _quest_conn


def db_error(request: Request, exc: Exception) -> JSONResponse:
    """Roll back the QuestDB connection on error and return a 503 envelope."""
    try:
        if _quest_conn and not _quest_conn.closed:
            _quest_conn.rollback()
    except Exception:
        pass
    quest_breaker.record_failure()
    logger.warning("QuestDB error: %s: %s", type(exc).__name__, exc)
    return error_response(503, "db_error", f"{type(exc).__name__}: {exc}",
                          request_id=req_id(request))


# ---------------------------------------------------------------------------
# Signal-processing helpers (per-degree torque/position aggregation)
# ---------------------------------------------------------------------------

DEG_BINS       = 360
_SW, _SP       = 9, 4    # Savitzky-Golay window, polynomial order


def interp_nans(arr):
    out = arr.copy()
    nans = np.isnan(out)
    if np.all(nans) or not np.any(nans):
        return out
    x = np.arange(len(out))
    out[nans] = np.interp(x[nans], x[~nans], out[~nans])
    return out


def smooth(sig):
    if len(sig) < _SW:
        return sig
    return savgol_filter(interp_nans(sig), _SW, _SP)


def bin_avg_full360(rows):
    ps = np.zeros(DEG_BINS); pc = np.zeros(DEG_BINS)
    ts = np.zeros(DEG_BINS); tc = np.zeros(DEG_BINS)
    for r in rows:
        d = r[1]
        if d is None:
            continue
        b = int(d) % DEG_BINS
        if r[2] is not None:
            ps[b] += r[2]; pc[b] += 1
        if r[3] is not None:
            ts[b] += r[3]; tc[b] += 1
    avg_pos = np.full(DEG_BINS, np.nan)
    avg_trq = np.full(DEG_BINS, np.nan)
    m = pc > 0; avg_pos[m] = ps[m] / pc[m]
    m = tc > 0; avg_trq[m] = ts[m] / tc[m]
    return avg_pos, avg_trq


# ---------------------------------------------------------------------------
# Active config loader (laminate + machine), read-once-per-call
# ---------------------------------------------------------------------------


def load_quest_config() -> dict:
    """Load the active laminate + machine config rows from QuestDB."""
    conn = get_quest()
    with conn.cursor() as cur:
        cur.execute("""SELECT laminate_name, d1, d2, d3, k_a, k_b, k_c,
                       alpha_pe, alpha_vmpet, alpha_pet,
                       sit_threshold, heat_target, torque_target, time_target
                       FROM 'leakage_laminate_config.csv'
                       WHERE is_active = 't' LIMIT 1""")
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "No active laminate config")
        lam_keys = ["laminate_name", "d1", "d2", "d3", "k_A", "k_B", "k_C",
                    "alpha_PE", "alpha_VMPET", "alpha_PET",
                    "SIT", "HEAT_TARGET", "TORQUE_TARGET", "SEALING_TIME_TARGET"]
        lam = dict(zip(lam_keys, row))

        cur.execute("""SELECT machine_id, ambient_temp, area_a, alpha, beta, const_c,
                       t_eff, seal_a, seal_b, seal_c, s2_threshold,
                       temp_front_col, temp_rear_col, trq_tag, pos_tag
                       FROM 'leakage_machine_config.csv' LIMIT 1""")
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "No machine config")
        mach_keys = ["machine_id", "ambient_temp", "A", "alpha", "beta", "C",
                     "T_eff", "seal_a", "seal_b", "seal_c", "S2_THRESHOLD",
                     "H_TEMP_FRONT", "H_TEMP_REAR", "H_TRQ_TAG", "H_POS_TAG"]
        mach = dict(zip(mach_keys, row))
    return {**lam, **mach}


def ts_to_epoch_ms(ts) -> int:
    """Convert a psycopg2 datetime to epoch-ms."""
    if ts is None:
        return 0
    if hasattr(ts, "timestamp"):
        return int(ts.timestamp() * 1000)
    return 0


def safe_float(v) -> Optional[float]:
    """Pass None through so the frontend renders '—'."""
    return float(v) if v is not None else None


# ---------------------------------------------------------------------------
# Cycle-row shaping — shared between REST endpoints and the WS live loop
# ---------------------------------------------------------------------------

SEAL_LOG_COLS = (
    "cycle_id, timestamp, seal_index, status, SIT, "
    "r_sit, r_trq, r_time, avg_torque, t_seal_ms, T_jaw"
)

TQI_LOG_COLS = (
    "cycle_id, timestamp, tqi, fill_score, contamination_score, "
    "uniformity_score, status, defect_description"
)


def seal_row_to_dict(row) -> dict:
    """Map a `seal_index_log.csv` row to the response shape."""
    cycle_id, ts, seal_index, status, sit, r_sit, r_trq, r_time, avg_torque, t_seal_ms, T_jaw = row
    return {
        "cycle_id":   int(cycle_id) if cycle_id is not None else None,
        "timestamp":  ts.isoformat() if hasattr(ts, "isoformat") else (str(ts) if ts else None),
        "seal_index": float(seal_index) if seal_index is not None else None,
        "status":     status,
        "SIT":        float(sit) if sit is not None else None,
        "T_inner":    float(sit) if sit is not None else None,
        "T_jaw":      float(T_jaw) if T_jaw is not None else None,
        "jaw_temp":   float(T_jaw) if T_jaw is not None else None,
        "r_sit":      float(r_sit) if r_sit is not None else None,
        "r_trq":      float(r_trq) if r_trq is not None else None,
        "r_time":     float(r_time) if r_time is not None else None,
        "avg_torque": float(avg_torque) if avg_torque is not None else None,
        "t_seal_ms":  float(t_seal_ms) if t_seal_ms is not None else None,
    }


def tqi_row_to_dict(row) -> dict:
    """Map a `tqi_log.csv` row to the shape expected by the frontend."""
    cid, ts, tqi, fill, contam, unif, status, defect = row
    return {
        "cycle_id":            int(cid) if cid is not None else None,
        "timestamp":           ts_to_epoch_ms(ts),
        "tqi":                 safe_float(tqi),
        "fill_score":          safe_float(fill),
        "contamination_score": safe_float(contam),
        "uniformity_score":    safe_float(unif),
        "status":              status,
        "defect_description":  defect,
    }
