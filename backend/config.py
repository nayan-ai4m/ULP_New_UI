"""
Database configuration for the New UI backend.

Two logical sources, both on host 20.20.20.238 by default:

    DATA_DB   - QuestDB  `qdb`         (port 8812 — pgwire)
                Live + historian data: ms_data, sec_data,
                seal_index_log, mae_values, tqi_log,
                leakage_laminate_config, leakage_machine_config

    CONFIG_DB - Postgres `ulp_cavity`  (port 5432)
                Auth only: users, roles, sessions, audit_trail
                (not used in Phase 1 — Dashboard is unauthenticated)

Override any value with environment variables.
"""

from __future__ import annotations

import os

_DEFAULT_DB_HOST = os.environ.get("DB_HOST", "20.20.20.238")
_PG_USER         = os.environ.get("PG_USER", "postgres")
_PG_PASSWORD     = os.environ.get("PG_PASSWORD", "ai4m2025")

# ---------------------------------------------------------------------------
# DATA_DB — QuestDB (Postgres wire protocol on :8812) for ALL cycle data.
# Real table names carry a `.csv` suffix and must be quoted in queries.
# ---------------------------------------------------------------------------

DATA_DB = {
    "host":     os.environ.get("DATA_DB_HOST", _DEFAULT_DB_HOST),
    "port":     int(os.environ.get("DATA_DB_PORT", "8812")),
    "dbname":   os.environ.get("DATA_DB_NAME", "qdb"),
    "user":     os.environ.get("DATA_DB_USER", "admin"),
    "password": os.environ.get("DATA_DB_PASSWORD", "quest"),
}

# ---------------------------------------------------------------------------
# CONFIG_DB — Postgres `ulp_cavity` (auth — reserved for Phase 2)
# ---------------------------------------------------------------------------

CONFIG_DB = {
    "host":     os.environ.get("CONFIG_DB_HOST", _DEFAULT_DB_HOST),
    "port":     int(os.environ.get("CONFIG_DB_PORT", "5432")),
    "dbname":   os.environ.get("CONFIG_DB_NAME", "ulp_cavity"),
    "user":     os.environ.get("CONFIG_DB_USER", _PG_USER),
    "password": os.environ.get("CONFIG_DB_PASSWORD", _PG_PASSWORD),
}

# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------

SEAL_GOOD_THRESHOLD = 0.75
SEAL_OKAY_THRESHOLD = 0.50

TAIL_REJECT_THRESHOLD = 0.80
TAIL_WARN_THRESHOLD   = 0.60

HISTORY_DEFAULT_LIMIT = 100
HISTORY_MAX_LIMIT     = 500
