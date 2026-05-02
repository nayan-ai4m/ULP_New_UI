"""New UI Dashboard backend — FastAPI application.

Endpoints:
    GET  /healthz             — health check
    GET  /api/tqi/stream      — MJPEG thermal stream (default = camera 1)
    GET  /api/tqi/stream/1    — MJPEG thermal stream — Camera 1 (ZMQ port 5690)
    GET  /api/tqi/stream/2    — MJPEG thermal stream — Camera 2 (ZMQ port 5691)
    GET  /api/tqi/status      — ZMQ connection status
    WS   /ws                  — WebSocket live feed (mounted from ws.py)
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import zmq
import zmq.asyncio as azmq
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse

from core import state
from core.errors import register_exception_handlers, register_request_id_middleware
from ws import router as ws_router

logger = logging.getLogger("backend.app")
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s")

# ---------------------------------------------------------------------------
# TQI Thermal Camera — ZMQ → MJPEG bridge
# ---------------------------------------------------------------------------

_ASSETS_DIR = Path(__file__).parent / "assets"

_TQI_FRAME_W = 640
_TQI_FRAME_H = 512
_TQI_FRAME_C = 3
_TQI_FRAME_SZ = _TQI_FRAME_W * _TQI_FRAME_H * _TQI_FRAME_C
_TQI_FPS = 15

# Camera 1
_TQI_ZMQ_PORT = 5690
_LATEST_TQI_FRAME: Optional[bytes] = None
_ZMQ_CONNECTED = False

# Camera 2
_TQI_ZMQ_PORT_2 = 5691
_LATEST_TQI_FRAME_2: Optional[bytes] = None
_ZMQ_CONNECTED_2 = False

_DEMO_FRAMES: list[bytes] = []


def _load_demo_frames() -> list[bytes]:
    """Load demo thermal JPEGs from assets/ as fallback frames."""
    paths = [
        _ASSETS_DIR / "frame_000027.jpg",
        _ASSETS_DIR / "frame_000299.jpg",
    ]
    frames: list[bytes] = []
    for p in paths:
        if not p.exists():
            continue
        img = cv2.imread(str(p), cv2.IMREAD_COLOR)
        if img is None:
            continue
        img = cv2.resize(img, (_TQI_FRAME_W, _TQI_FRAME_H),
                         interpolation=cv2.INTER_LANCZOS4)
        ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if ok:
            frames.append(bytes(buf))
    return frames


async def _tqi_zmq_receiver() -> None:
    """Background task — Camera 1.  Subscribes to ZMQ PUB on port 5690.
    Converts raw BGR frames to JPEG.  Falls back to demo frames when ZMQ
    producer is not running."""
    global _LATEST_TQI_FRAME, _ZMQ_CONNECTED

    endpoint = f"tcp://localhost:{_TQI_ZMQ_PORT}"
    frame_interval = 1.0 / _TQI_FPS
    demo_idx = 0
    n_demo = len(_DEMO_FRAMES)

    ctx = azmq.Context()
    sock = ctx.socket(zmq.SUB)
    sock.setsockopt(zmq.SUBSCRIBE, b"")
    sock.setsockopt(zmq.RCVHWM, 10)
    sock.setsockopt(zmq.LINGER, 0)
    sock.setsockopt(zmq.RCVTIMEO, 300)
    sock.connect(endpoint)

    logger.info("TQI-1: ZMQ SUB connected to %s", endpoint)
    consecutive_timeouts = 0

    while True:
        try:
            data = await asyncio.wait_for(sock.recv(), timeout=0.35)
            if len(data) == _TQI_FRAME_SZ:
                arr = np.frombuffer(data, dtype="uint8").reshape(
                    (_TQI_FRAME_H, _TQI_FRAME_W, _TQI_FRAME_C)
                )
                ok, buf = cv2.imencode(".jpg", arr, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if ok:
                    _LATEST_TQI_FRAME = bytes(buf)
                    _ZMQ_CONNECTED = True
                    consecutive_timeouts = 0
        except (asyncio.TimeoutError, zmq.Again):
            consecutive_timeouts += 1
            if consecutive_timeouts > 5:
                _ZMQ_CONNECTED = False
            if n_demo:
                _LATEST_TQI_FRAME = _DEMO_FRAMES[demo_idx % n_demo]
                demo_idx += 1
            await asyncio.sleep(frame_interval)
        except Exception as exc:
            _ZMQ_CONNECTED = False
            if n_demo:
                _LATEST_TQI_FRAME = _DEMO_FRAMES[demo_idx % n_demo]
                demo_idx += 1
            await asyncio.sleep(frame_interval)
            logger.warning("TQI-1: ZMQ error: %s", exc)


async def _tqi_zmq_receiver_2() -> None:
    """Background task — Camera 2.  Subscribes to ZMQ PUB on port 5691."""
    global _LATEST_TQI_FRAME_2, _ZMQ_CONNECTED_2

    endpoint = f"tcp://localhost:{_TQI_ZMQ_PORT_2}"
    frame_interval = 1.0 / _TQI_FPS
    demo_idx = 1   # start at 1 so Camera 2 shows a different frame than Camera 1
    n_demo = len(_DEMO_FRAMES)

    ctx = azmq.Context()
    sock = ctx.socket(zmq.SUB)
    sock.setsockopt(zmq.SUBSCRIBE, b"")
    sock.setsockopt(zmq.RCVHWM, 10)
    sock.setsockopt(zmq.LINGER, 0)
    sock.setsockopt(zmq.RCVTIMEO, 300)
    sock.connect(endpoint)

    logger.info("TQI-2: ZMQ SUB connected to %s", endpoint)
    consecutive_timeouts = 0

    while True:
        try:
            data = await asyncio.wait_for(sock.recv(), timeout=0.35)
            if len(data) == _TQI_FRAME_SZ:
                arr = np.frombuffer(data, dtype="uint8").reshape(
                    (_TQI_FRAME_H, _TQI_FRAME_W, _TQI_FRAME_C)
                )
                ok, buf = cv2.imencode(".jpg", arr, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if ok:
                    _LATEST_TQI_FRAME_2 = bytes(buf)
                    _ZMQ_CONNECTED_2 = True
                    consecutive_timeouts = 0
        except (asyncio.TimeoutError, zmq.Again):
            consecutive_timeouts += 1
            if consecutive_timeouts > 5:
                _ZMQ_CONNECTED_2 = False
            if n_demo:
                _LATEST_TQI_FRAME_2 = _DEMO_FRAMES[demo_idx % n_demo]
                demo_idx += 1
            await asyncio.sleep(frame_interval)
        except Exception as exc:
            _ZMQ_CONNECTED_2 = False
            if n_demo:
                _LATEST_TQI_FRAME_2 = _DEMO_FRAMES[demo_idx % n_demo]
                demo_idx += 1
            await asyncio.sleep(frame_interval)
            logger.warning("TQI-2: ZMQ error: %s", exc)


# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _DEMO_FRAMES
    _DEMO_FRAMES = _load_demo_frames()
    logger.info("Loaded %d demo thermal frames", len(_DEMO_FRAMES))

    t1 = asyncio.create_task(_tqi_zmq_receiver())
    t2 = asyncio.create_task(_tqi_zmq_receiver_2())

    yield

    t1.cancel()
    t2.cancel()
    for t in (t1, t2):
        try:
            await t
        except asyncio.CancelledError:
            pass


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="New UI Dashboard Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — wide-open for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
register_request_id_middleware(app)

# Mount the WS router
app.include_router(ws_router)


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------


@app.get("/healthz")
async def healthz():
    uptime = time.time() - state.START_TIME
    return {
        "ok": True,
        "uptime_s": round(uptime, 1),
        "sku": state.CACHED_SKU,
    }


@app.get("/api/tqi/stream")
async def tqi_stream():
    """MJPEG stream for TQI thermal camera (default = Camera 1)."""

    async def mjpeg_gen():
        while True:
            jpg = _LATEST_TQI_FRAME
            if jpg:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpg)).encode() + b"\r\n\r\n"
                    + jpg + b"\r\n"
                )
            await asyncio.sleep(1 / _TQI_FPS)

    return StreamingResponse(
        mjpeg_gen(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/tqi/stream/1")
async def tqi_stream_1():
    """MJPEG stream — Camera 1 (ZMQ port 5690)."""
    return await tqi_stream()


@app.get("/api/tqi/stream/2")
async def tqi_stream_2():
    """MJPEG stream — Camera 2 (ZMQ port 5691)."""

    async def mjpeg_gen():
        while True:
            jpg = _LATEST_TQI_FRAME_2
            if jpg:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpg)).encode() + b"\r\n\r\n"
                    + jpg + b"\r\n"
                )
            await asyncio.sleep(1 / _TQI_FPS)

    return StreamingResponse(
        mjpeg_gen(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/tqi/status")
async def tqi_status():
    """Quick poll: is the ZMQ producer connected?"""
    return {
        "camera_1": {"zmq_connected": _ZMQ_CONNECTED, "frame_w": _TQI_FRAME_W, "frame_h": _TQI_FRAME_H},
        "camera_2": {"zmq_connected": _ZMQ_CONNECTED_2, "frame_w": _TQI_FRAME_W, "frame_h": _TQI_FRAME_H},
    }
