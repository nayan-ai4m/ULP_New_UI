#!/usr/bin/env bash
# Bootstrap + launch for the New UI Dashboard backend.
# Idempotent: re-running is safe; re-uses an existing .venv.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  echo "[backend] creating venv (first run only)"
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

if ! python -c "import fastapi, cv2, zmq, numpy" 2>/dev/null; then
  echo "[backend] installing deps"
  pip install --disable-pip-version-check -q -r requirements.txt
fi

echo "[backend] starting uvicorn on http://localhost:8080 (app:app)"
echo "[backend]   data DB: QuestDB :8812"
echo "[backend]   stop:    Ctrl-C"

UVICORN_ARGS=(--host 0.0.0.0 --port 8080)
[ "${NO_RELOAD:-0}" = "1" ] || UVICORN_ARGS+=(--reload)
exec uvicorn app:app "${UVICORN_ARGS[@]}"
