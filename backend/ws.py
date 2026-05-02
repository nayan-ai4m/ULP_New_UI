"""WebSocket endpoint /ws — live cycle / status feed for the Dashboard.

Polls QuestDB once per second; when `seal_index_log.cycle_id` advances,
publishes `mc26/live/cycle` and (on-change) `mc26/live/status` to
subscribed clients.  Also supports `mc26/live/pqi/detail` and
`mc26/live/tqi/detail` for PQI/TQI sub-pages (future).

On first subscribe, replays the last 100 historical cycles so charts
render with depth immediately.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core import state
from core.grading import grade_for
from core.quest import (
    SEAL_LOG_COLS,
    TQI_LOG_COLS,
    bin_avg_full360,
    DEG_BINS,
    get_quest,
    load_quest_config,
    seal_row_to_dict,
    smooth,
    ts_to_epoch_ms,
    tqi_row_to_dict,
)

logger = logging.getLogger("backend.ws")

router = APIRouter()


_DEFAULT_LAMINATE_PLACEHOLDER = "Default Laminate"


def _refresh_sku_cache() -> None:
    """Look up the active SKU from QuestDB's leakage_laminate_config."""
    laminate_name: Optional[str] = None
    try:
        conn = get_quest()
        with conn.cursor() as cur:
            cur.execute("SELECT laminate_name FROM 'leakage_laminate_config.csv' "
                        "WHERE is_active = 't' LIMIT 1")
            row = cur.fetchone()
        if row and row[0]:
            laminate_name = str(row[0]).strip()
    except Exception as exc:
        logger.warning("sku cache refresh failed: %s", exc)

    if (
        not laminate_name
        or laminate_name.casefold() == _DEFAULT_LAMINATE_PLACEHOLDER.casefold()
    ):
        state.CACHED_SKU = "SKU-A"  # fallback default
        return
    state.CACHED_SKU = laminate_name


# ---------------------------------------------------------------------------
# Profile & SIT readers (for PQI page — heavy, only read when subscribed)
# ---------------------------------------------------------------------------

_PROFILE_AVG_CYCLES = 20


def _read_cycle_profile(cycle_id: int, cfg: dict) -> Optional[dict]:
    """Per-degree torque/position trace, averaged across the most recent
    cycles in `ms_data.csv`."""
    try:
        conn = get_quest()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT cycle_id FROM 'ms_data.csv' "
                "ORDER BY cycle_id DESC LIMIT %s", (_PROFILE_AVG_CYCLES,))
            ids = [int(r[0]) for r in cur.fetchall() if r[0] is not None]
            if not ids:
                return None
            ids_csv = ",".join(str(c) for c in ids)
            cur.execute(
                f'SELECT cycle_id, machine_degree, "{cfg["H_POS_TAG"]}", '
                f'"{cfg["H_TRQ_TAG"]}" FROM \'ms_data.csv\' '
                f'WHERE cycle_id IN ({ids_csv}) ORDER BY cycle_id, machine_degree')
            rows = cur.fetchall()
        if not rows:
            return None
        raw_pos, raw_trq = bin_avg_full360(rows)
        import numpy as np
        s_pos = smooth(raw_pos)
        s_trq = smooth(raw_trq)
        return {
            "degrees":  list(range(DEG_BINS)),
            "position": [0.0 if np.isnan(v) else float(v) for v in s_pos],
            "torque":   [0.0 if np.isnan(v) else float(v) for v in s_trq],
        }
    except Exception as exc:
        logger.warning("profile read failed cycle=%s: %s", cycle_id, exc)
        return None


def _read_cycle_sit(cycle_id: int, cfg: dict) -> Optional[dict]:
    """Heat (front+rear thermocouple) time-series from `sec_data.csv`."""
    try:
        conn = get_quest()
        front, rear = cfg["H_TEMP_FRONT"], cfg["H_TEMP_REAR"]
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT timestamp, "{front}", "{rear}" '
                f"FROM 'sec_data.csv' WHERE cycle_id = %s ORDER BY timestamp",
                (cycle_id,))
            rows = cur.fetchall()
            if not rows:
                cur.execute(
                    "SELECT cycle_id FROM 'sec_data.csv' "
                    "ORDER BY cycle_id DESC LIMIT 50")
                candidates = [int(r[0]) for r in cur.fetchall() if r[0] is not None]
                for cand in candidates:
                    cur.execute(
                        f'SELECT timestamp, "{front}", "{rear}" '
                        f"FROM 'sec_data.csv' WHERE cycle_id = %s ORDER BY timestamp",
                        (cand,))
                    rows = cur.fetchall()
                    if len(rows) >= 5:
                        break
        if not rows:
            return None
        time_ms = []
        t_inner = []
        t0_ms = ts_to_epoch_ms(rows[0][0]) if rows[0][0] else 0
        for ts, tf, tr in rows:
            time_ms.append(ts_to_epoch_ms(ts) - t0_ms)
            avg = ((float(tf) if tf is not None else 0.0)
                   + (float(tr) if tr is not None else 0.0)) / 2.0
            t_inner.append(avg)
        return {"time_ms": time_ms, "t_inner_c": t_inner}
    except Exception as exc:
        logger.warning("sit read failed cycle=%s: %s", cycle_id, exc)
        return None


# ---------------------------------------------------------------------------
# Backfill — on subscribe, replay the last N historical cycles
# ---------------------------------------------------------------------------

BACKFILL_N = 100
_BACKFILL_TOPICS = {
    "mc26/live/cycle",
    "mc26/live/pqi/detail",
    "mc26/live/tqi/detail",
}


def _fetch_last_n_history(n: int) -> list[dict]:
    """Pull the last N seal+mae+tqi rows from QuestDB and shape each into
    the same payloads the live loop emits — oldest-first so the frontend's
    ring buffers fill in chronological order."""
    conn = get_quest()
    with conn.cursor() as cur:
        cur.execute(f"SELECT {SEAL_LOG_COLS} FROM 'seal_index_log.csv' "
                    "WHERE status IS NULL OR status <> 'DUMMY' "
                    "ORDER BY cycle_id DESC LIMIT %s", (n,))
        seal_rows = cur.fetchall()
        if not seal_rows:
            return []
        cycle_ids = [int(r[0]) for r in seal_rows]
        ids_csv = ",".join(str(c) for c in cycle_ids)
        cur.execute(
            f"SELECT cycle_id, mae, status FROM 'mae_values.csv' "
            f"WHERE cycle_id IN ({ids_csv}) "
            f"AND (status IS NULL OR status <> 'DUMMY')"
        )
        tail_map = {int(r[0]): r for r in cur.fetchall()}
        cur.execute(
            f"SELECT {TQI_LOG_COLS} FROM 'tqi_log.csv' "
            f"WHERE cycle_id IN ({ids_csv}) "
            f"AND (status IS NULL OR status <> 'DUMMY')"
        )
        tqi_map = {int(r[0]): tqi_row_to_dict(r) for r in cur.fetchall()}

    if state.CACHED_SKU is None:
        _refresh_sku_cache()
    sku = state.CACHED_SKU or "—"

    out: list[dict] = []
    for seal_row in reversed(seal_rows):  # oldest-first
        seal = seal_row_to_dict(seal_row)
        cid = seal["cycle_id"]
        if cid is None:
            continue
        tail = tail_map.get(cid)
        tail_mae = float(tail[1]) if tail and tail[1] is not None else 0.0
        tail_status_raw = tail[2] if tail else None
        tail_status = tail_status_raw if tail_status_raw in ("NORMAL", "WARNING", "REJECT") else "NORMAL"

        tqi_payload = tqi_map.get(cid)
        tqi_score = tqi_payload["tqi"] if tqi_payload else None
        pqi_score = seal["seal_index"] or 0.0
        sqi_score = pqi_score if tqi_score is None else round(0.6 * pqi_score + 0.4 * tqi_score, 4)

        ts_raw = seal_row[1]
        ts_ms = int(ts_raw.timestamp() * 1000) if hasattr(ts_raw, "timestamp") else 0

        out.append({
            "cycle_id": cid,
            "ts_ms":    ts_ms,
            "cycle": {
                "sqi":      sqi_score,
                "pqi":      pqi_score,
                "tqi":      tqi_score,
                "vqi":      None,
                "grade":    grade_for(sqi_score),
                "sku":      sku,
                "cycle_id": cid,
                "running":  True,
            },
            "pqi_detail": {
                "r_sit":          seal["r_sit"] or 0.0,
                "r_trq":          seal["r_trq"] or 0.0,
                "r_time":         seal["r_time"] or 0.0,
                "t_inner_c":      seal["T_inner"] or 0.0,
                "avg_torque":     seal["avg_torque"] or 0.0,
                "dwell_ms":       seal["t_seal_ms"] or 0.0,
                "jaw_temp_c":     seal["T_jaw"] or 0.0,
                "tailing_index":  tail_mae,
                "tailing_status": tail_status,
            },
            "tqi_detail": ({
                "tqi":                 tqi_payload["tqi"],
                "fill_score":          tqi_payload["fill_score"],
                "contamination_score": tqi_payload["contamination_score"],
                "uniformity_score":    tqi_payload["uniformity_score"],
                "status":              tqi_payload["status"],
                "defect_description":  tqi_payload["defect_description"],
            } if tqi_payload else None),
        })
    return out


# ---------------------------------------------------------------------------
# Live snapshot — read latest cycle from QuestDB
# ---------------------------------------------------------------------------


def _read_live_snapshot() -> Optional[dict]:
    """Pull the newest cycle's seal + tailing + tqi rows from QuestDB and
    shape them into the WS payloads the frontend expects."""
    conn = get_quest()
    with conn.cursor() as cur:
        cur.execute(f"SELECT {SEAL_LOG_COLS} FROM 'seal_index_log.csv' "
                    "WHERE status IS NULL OR status <> 'DUMMY' "
                    "ORDER BY cycle_id DESC LIMIT 1")
        seal_row = cur.fetchone()
        if not seal_row:
            return None

        cur.execute("SELECT cycle_id, mae, status FROM 'mae_values.csv' "
                    "WHERE status IS NULL OR status <> 'DUMMY' "
                    "ORDER BY cycle_id DESC LIMIT 1")
        tail_row = cur.fetchone()

        cur.execute("SELECT auto_run FROM 'sec_data.csv' "
                    "ORDER BY timestamp DESC LIMIT 1")
        run_row = cur.fetchone()

        cur.execute(f"SELECT {TQI_LOG_COLS} FROM 'tqi_log.csv' "
                    "WHERE status IS NULL OR status <> 'DUMMY' "
                    "ORDER BY cycle_id DESC LIMIT 1")
        tqi_row = cur.fetchone()

    seal = seal_row_to_dict(seal_row)
    pqi_score = seal["seal_index"] or 0.0
    tail_mae = float(tail_row[1]) if tail_row and tail_row[1] is not None else 0.0
    tail_status = tail_row[2] if tail_row and tail_row[2] else "NORMAL"
    running = bool(run_row and run_row[0])

    tqi_payload: Optional[dict] = tqi_row_to_dict(tqi_row) if tqi_row else None
    tqi_score: Optional[float] = tqi_payload["tqi"] if tqi_payload else None

    cycle_id = seal["cycle_id"] or 0
    if state.CACHED_SKU is None:
        _refresh_sku_cache()
    sku = state.CACHED_SKU or "—"

    # SQI = 0.6*PQI + 0.4*TQI  (or PQI alone when TQI is null)
    sqi_score = pqi_score
    if tqi_score is not None:
        sqi_score = round(0.6 * pqi_score + 0.4 * tqi_score, 4)
    grade = grade_for(sqi_score)

    cycle_payload = {
        "sqi":      sqi_score,
        "pqi":      pqi_score,
        "tqi":      tqi_score,
        "vqi":      None,
        "grade":    grade,
        "sku":      sku,
        "cycle_id": cycle_id,
        "running":  running,
    }
    pqi_detail_payload = {
        "r_sit":          seal["r_sit"] or 0.0,
        "r_trq":          seal["r_trq"] or 0.0,
        "r_time":         seal["r_time"] or 0.0,
        "t_inner_c":      seal["T_inner"] or 0.0,
        "avg_torque":     seal["avg_torque"] or 0.0,
        "dwell_ms":       seal["t_seal_ms"] or 0.0,
        "jaw_temp_c":     seal["T_jaw"] or 0.0,
        "tailing_index":  tail_mae,
        "tailing_status": tail_status if tail_status in ("NORMAL", "WARNING", "REJECT") else "NORMAL",
    }
    status_payload = {
        "running": running,
        "cpm":     0.0,
        "sku":     sku,
    }
    return {
        "cycle_id":   cycle_id,
        "running":    running,
        "cycle":      cycle_payload,
        "pqi_detail": pqi_detail_payload,
        "tqi_detail": ({
            "tqi":                 tqi_payload["tqi"]                 if tqi_payload else None,
            "fill_score":          tqi_payload["fill_score"]          if tqi_payload else None,
            "contamination_score": tqi_payload["contamination_score"] if tqi_payload else None,
            "uniformity_score":    tqi_payload["uniformity_score"]    if tqi_payload else None,
            "status":              tqi_payload["status"]              if tqi_payload else None,
            "defect_description":  tqi_payload["defect_description"]  if tqi_payload else None,
        } if tqi_payload else None),
        "status":     status_payload,
    }


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------


@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    """Live loop: poll QuestDB every ~1s; emit on cycle advance or
    on-change status."""
    await websocket.accept()

    subs: set[str] = set()
    backfilled: set[str] = set()
    last_cycle_id: int = -1
    last_status_key: Optional[tuple] = None
    stop = asyncio.Event()

    _refresh_sku_cache()

    async def _send(topic: str, payload: Any, cycle_id: int, now_ms: int) -> None:
        if topic not in subs:
            return
        try:
            data = payload.model_dump() if hasattr(payload, "model_dump") else payload
            await websocket.send_json({
                "topic":    topic,
                "ts_ms":    now_ms,
                "cycle_id": cycle_id,
                "payload":  data,
            })
        except Exception:
            stop.set()

    async def live_loop():
        nonlocal last_cycle_id, last_status_key

        while not stop.is_set():
            try:
                await asyncio.wait_for(stop.wait(), timeout=1.0)
                return
            except asyncio.TimeoutError:
                pass

            now_ms = int(time.time() * 1000)

            try:
                snap = await asyncio.to_thread(_read_live_snapshot)
            except Exception as exc:
                logger.warning("live_loop: QuestDB read failed: %s", exc)
                snap = None

            if snap and snap["cycle_id"] != last_cycle_id:
                last_cycle_id = snap["cycle_id"]
                cid = snap["cycle_id"]
                await _send("mc26/live/cycle",      snap["cycle"],      cid, now_ms)
                await _send("mc26/live/pqi/detail", snap["pqi_detail"], cid, now_ms)
                await _send("mc26/live/tqi/detail", snap["tqi_detail"], cid, now_ms)

                # Heavy graph topics — only fetched when subscribed
                if "mc26/live/profile" in subs or "mc26/live/sit" in subs:
                    try:
                        cfg = await asyncio.to_thread(load_quest_config)
                    except Exception as exc:
                        logger.warning("live_loop: config load failed: %s", exc)
                        cfg = None
                    if cfg:
                        if "mc26/live/profile" in subs:
                            prof = await asyncio.to_thread(_read_cycle_profile, cid, cfg)
                            if prof is not None:
                                await _send("mc26/live/profile", prof, cid, now_ms)
                        if "mc26/live/sit" in subs:
                            sit = await asyncio.to_thread(_read_cycle_sit, cid, cfg)
                            if sit is not None:
                                await _send("mc26/live/sit", sit, cid, now_ms)

                status_key = (snap["status"]["running"],
                              snap["status"]["cpm"],
                              snap["status"]["sku"])
                if status_key != last_status_key:
                    await _send("mc26/live/status", snap["status"], cid, now_ms)
                    last_status_key = status_key

    loop_task = asyncio.create_task(live_loop())
    try:
        while True:
            msg = await websocket.receive_json()
            action = msg.get("action")
            topics: list[str] = msg.get("topics") or []
            if action == "subscribe":
                new_topics = [t for t in topics if t not in subs]
                subs.update(topics)

                # Backfill historical cycles for score-trend topics
                replay_topics = [t for t in new_topics
                                 if t in _BACKFILL_TOPICS and t not in backfilled]
                if replay_topics:
                    try:
                        history_rows = await asyncio.to_thread(
                            _fetch_last_n_history, BACKFILL_N
                        )
                    except Exception as exc:
                        logger.warning("backfill failed: %s", exc)
                        history_rows = []
                    for entry in history_rows:
                        cid = entry["cycle_id"]
                        ts_ms = entry["ts_ms"] or int(time.time() * 1000)
                        if "mc26/live/cycle" in replay_topics:
                            await _send("mc26/live/cycle", entry["cycle"], cid, ts_ms)
                        if "mc26/live/pqi/detail" in replay_topics:
                            await _send("mc26/live/pqi/detail", entry["pqi_detail"], cid, ts_ms)
                        if ("mc26/live/tqi/detail" in replay_topics
                                and entry["tqi_detail"] is not None):
                            await _send("mc26/live/tqi/detail", entry["tqi_detail"], cid, ts_ms)
                    backfilled.update(replay_topics)
                    if history_rows:
                        last_cycle_id = history_rows[-1]["cycle_id"]

                # Heavy per-cycle topics: replay latest on first subscribe
                heavy_new = [t for t in new_topics
                             if t in ("mc26/live/profile", "mc26/live/sit")
                             and t not in backfilled]
                if heavy_new:
                    try:
                        cfg = await asyncio.to_thread(load_quest_config)
                    except Exception as exc:
                        logger.warning("subscribe: config load failed: %s", exc)
                        cfg = None
                    latest_cid = last_cycle_id
                    if cfg and latest_cid <= 0:
                        try:
                            conn = await asyncio.to_thread(get_quest)
                            with conn.cursor() as cur:
                                cur.execute("SELECT cycle_id FROM 'seal_index_log.csv' "
                                            "ORDER BY cycle_id DESC LIMIT 1")
                                row = cur.fetchone()
                                if row and row[0] is not None:
                                    latest_cid = int(row[0])
                        except Exception as exc:
                            logger.warning("subscribe: latest cycle lookup failed: %s", exc)
                    if cfg and latest_cid > 0:
                        now_ms = int(time.time() * 1000)
                        if "mc26/live/profile" in heavy_new:
                            prof = await asyncio.to_thread(
                                _read_cycle_profile, latest_cid, cfg)
                            if prof is not None:
                                await _send("mc26/live/profile", prof,
                                            latest_cid, now_ms)
                                backfilled.add("mc26/live/profile")
                        if "mc26/live/sit" in heavy_new:
                            sit_payload = await asyncio.to_thread(
                                _read_cycle_sit, latest_cid, cfg)
                            if sit_payload is not None:
                                await _send("mc26/live/sit", sit_payload,
                                            latest_cid, now_ms)
                                backfilled.add("mc26/live/sit")
            elif action == "unsubscribe":
                subs.difference_update(topics)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        stop.set()
        loop_task.cancel()
        try:
            await loop_task
        except asyncio.CancelledError:
            pass
