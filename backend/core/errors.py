"""JSON error envelope + per-request id helper.

All routers import `error_response` and `req_id` from here so the wire
shape stays consistent.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("backend.errors")


def req_id(request: Optional[Request] = None) -> str:
    if request is not None and hasattr(request.state, "request_id"):
        return request.state.request_id
    return uuid.uuid4().hex


def error_response(
    status: int,
    code: str,
    message: str,
    details: Any = None,
    request_id: str = "",
) -> JSONResponse:
    body: dict = {
        "error":      {"code": code, "message": message},
        "request_id": request_id or uuid.uuid4().hex,
    }
    if details is not None:
        body["error"]["details"] = details
    return JSONResponse(status_code=status, content=body)


def register_exception_handlers(app: FastAPI) -> None:
    """Wire the JSON error envelope onto every uncaught exception class."""

    @app.exception_handler(HTTPException)
    async def _http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        code = exc.detail if isinstance(exc.detail, str) else "http_error"
        msg  = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return error_response(exc.status_code, code, msg, request_id=req_id(request))

    @app.exception_handler(RequestValidationError)
    async def _validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return error_response(
            422, "validation_failed", "Request body validation failed.",
            details=exc.errors(), request_id=req_id(request),
        )

    @app.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return error_response(
            500, "internal_error",
            f"Unexpected server error: {type(exc).__name__}",
            request_id=req_id(request),
        )


def register_request_id_middleware(app: FastAPI) -> None:
    """Stamp every response with X-Request-ID; reuse the inbound header if set."""

    @app.middleware("http")
    async def _request_id_middleware(request: Request, call_next):
        request_id_value = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        request.state.request_id = request_id_value
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id_value
        return response
