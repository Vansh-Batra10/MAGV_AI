"""Time sources.

Domain code asks a `Clock` for "now" in a tenant's timezone. Nothing else in the codebase may
call `datetime.now()` / `datetime.utcnow()` (a test enforces this). Infrastructure timestamps
(created_at, job leases, webhook receipt) use `real_utc_now()`, which is never faked.

`DemoClock` implements the DEMO_NOW override (DESIGN.md section 5.5). It refuses to exist
unless APP_ENV=demo.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Literal, Protocol
from zoneinfo import ZoneInfo

ClockSource = Literal["system", "demo"]


def real_utc_now() -> datetime:
    """Real wall-clock time in UTC. Use for infrastructure timestamps only."""
    return datetime.now(UTC)


class Clock(Protocol):
    source: ClockSource

    def now(self, tz: ZoneInfo) -> datetime:
        """Current time as an aware datetime in `tz`."""
        ...

    def now_utc(self, tz: ZoneInfo) -> datetime:
        """Current time in UTC, as seen by a tenant in `tz`."""
        ...


class SystemClock:
    source: ClockSource = "system"

    def now(self, tz: ZoneInfo) -> datetime:
        return datetime.now(tz)

    def now_utc(self, tz: ZoneInfo) -> datetime:
        return datetime.now(UTC)


class DemoClockError(ValueError):
    pass


def _validate_local_time(naive: datetime, tz: ZoneInfo) -> datetime:
    """Attach `tz` to a naive local time, rejecting DST gaps and folds."""
    early = naive.replace(tzinfo=tz, fold=0)
    late = naive.replace(tzinfo=tz, fold=1)
    # Check the gap first: inside a gap, fold=0/1 also yield different offsets.
    round_trip = early.astimezone(UTC).astimezone(tz).replace(tzinfo=None)
    if round_trip != naive:
        raise DemoClockError(
            f"DEMO_NOW {naive.isoformat()} does not exist in {tz.key} (DST spring-forward gap)."
        )
    if early.utcoffset() != late.utcoffset():
        raise DemoClockError(
            f"DEMO_NOW {naive.isoformat()} is ambiguous in {tz.key} (DST fall-back). "
            "Pick another time or give an explicit UTC offset."
        )
    return early


class DemoClock:
    """A clock anchored at DEMO_NOW.

    A naive DEMO_NOW (e.g. "2026-10-03T14:10") means that local wall time in *each tenant's*
    timezone. An offset-aware DEMO_NOW is one absolute instant for everyone.
    In "ticking" mode time advances in real time from process start; "frozen" holds it fixed.
    """

    source: ClockSource = "demo"

    def __init__(
        self,
        demo_now: str,
        *,
        app_env: str,
        mode: Literal["ticking", "frozen"] = "ticking",
        monotonic: Callable[[], float] = time.monotonic,
    ) -> None:
        if app_env != "demo":
            raise DemoClockError("DemoClock can only be constructed when APP_ENV=demo.")
        try:
            parsed = datetime.fromisoformat(demo_now.strip())
        except ValueError as exc:
            raise DemoClockError(f"DEMO_NOW {demo_now!r} is not an ISO 8601 datetime.") from exc
        self._anchor = parsed
        self._mode = mode
        self._monotonic = monotonic
        self._started = monotonic()

    @property
    def anchor(self) -> datetime:
        return self._anchor

    @property
    def mode(self) -> str:
        return self._mode

    def validate_for(self, tz: ZoneInfo) -> None:
        """Raise DemoClockError if DEMO_NOW is not a valid instant in `tz`."""
        self._anchor_utc(tz)

    def _anchor_utc(self, tz: ZoneInfo) -> datetime:
        if self._anchor.tzinfo is not None:
            return self._anchor.astimezone(UTC)
        return _validate_local_time(self._anchor, tz).astimezone(UTC)

    def _elapsed(self) -> timedelta:
        if self._mode == "frozen":
            return timedelta(0)
        return timedelta(seconds=self._monotonic() - self._started)

    def now_utc(self, tz: ZoneInfo) -> datetime:
        return self._anchor_utc(tz) + self._elapsed()

    def now(self, tz: ZoneInfo) -> datetime:
        return self.now_utc(tz).astimezone(tz)


def build_clock(*, app_env: str, demo_now: str | None, mode: Literal["ticking", "frozen"]) -> Clock:
    if demo_now:
        return DemoClock(demo_now, app_env=app_env, mode=mode)
    return SystemClock()
