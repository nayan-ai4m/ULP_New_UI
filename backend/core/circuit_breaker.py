"""Circuit breaker for external resources (QuestDB, PostgreSQL).

Prevents a flapping database from blocking the event loop with retry storms.

States: CLOSED → (failure_threshold within failure_window) → OPEN →
       (recovery_timeout) → HALF_OPEN → (success_threshold) → CLOSED
"""

from __future__ import annotations

import time
from collections import deque
from enum import Enum
from threading import Lock


class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitOpenError(RuntimeError):
    """Raised by callers that want a typed exception when the breaker is open."""


class CircuitBreaker:
    def __init__(
        self,
        name: str = "default",
        failure_threshold: int = 5,
        failure_window: float = 30.0,
        success_threshold: int = 2,
        recovery_timeout: float = 60.0,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.failure_window = failure_window
        self.success_threshold = success_threshold
        self.recovery_timeout = recovery_timeout

        self._state = CircuitState.CLOSED
        self._failures: deque = deque()
        self._consecutive_successes = 0
        self._opened_at = 0.0
        self._lock = Lock()

    @property
    def state(self) -> CircuitState:
        with self._lock:
            return self._state

    def allow_request(self) -> bool:
        with self._lock:
            now = time.monotonic()
            if self._state == CircuitState.CLOSED:
                return True
            if self._state == CircuitState.OPEN:
                if now - self._opened_at >= self.recovery_timeout:
                    self._state = CircuitState.HALF_OPEN
                    self._consecutive_successes = 0
                    return True
                return False
            return True  # HALF_OPEN

    def record_success(self) -> None:
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._consecutive_successes += 1
                if self._consecutive_successes >= self.success_threshold:
                    self._state = CircuitState.CLOSED
                    self._failures.clear()

    def record_failure(self) -> None:
        with self._lock:
            now = time.monotonic()
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                self._opened_at = now
                return
            while self._failures and now - self._failures[0] > self.failure_window:
                self._failures.popleft()
            self._failures.append(now)
            if len(self._failures) >= self.failure_threshold:
                self._state = CircuitState.OPEN
                self._opened_at = now

    def snapshot(self) -> dict:
        """Return a JSON-serialisable view for status endpoints."""
        with self._lock:
            return {
                "name":                    self.name,
                "state":                   self._state.value,
                "failures_in_window":      len(self._failures),
                "failure_threshold":       self.failure_threshold,
                "consecutive_successes":   self._consecutive_successes,
                "success_threshold":       self.success_threshold,
                "recovery_timeout_s":      self.recovery_timeout,
                "opened_at_monotonic":     self._opened_at if self._state != CircuitState.CLOSED else None,
            }


# Process-wide singletons used across REST + WS paths.
quest_breaker = CircuitBreaker(
    name="questdb", failure_threshold=5,
    failure_window=30.0, recovery_timeout=60.0,
)
