"""Minimal circuit breaker for the booking provider (DESIGN.md section 9)."""

from __future__ import annotations

import time
from collections.abc import Callable


class CircuitBreaker:
    def __init__(
        self,
        *,
        failure_threshold: int = 3,
        window_s: float = 60.0,
        reset_after_s: float = 120.0,
        monotonic: Callable[[], float] = time.monotonic,
    ) -> None:
        self._threshold = failure_threshold
        self._window = window_s
        self._reset_after = reset_after_s
        self._now = monotonic
        self._failures: list[float] = []
        self._opened_at: float | None = None

    @property
    def is_open(self) -> bool:
        if self._opened_at is None:
            return False
        # After reset_after the breaker is half-open: let one request through.
        return self._now() - self._opened_at < self._reset_after

    def record_success(self) -> None:
        self._failures.clear()
        self._opened_at = None

    def record_failure(self) -> None:
        now = self._now()
        self._failures = [t for t in self._failures if now - t <= self._window] + [now]
        if len(self._failures) >= self._threshold:
            self._opened_at = now
