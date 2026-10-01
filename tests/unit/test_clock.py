from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from receptionist.clock import DemoClock, DemoClockError, SystemClock, build_clock

CHI = ZoneInfo("America/Chicago")
DEN = ZoneInfo("America/Denver")


def test_system_clock_is_aware() -> None:
    now = SystemClock().now(CHI)
    assert now.tzinfo is not None
    assert abs(SystemClock().now_utc(CHI) - datetime.now(UTC)) < timedelta(seconds=5)


def test_demo_clock_refuses_non_demo_env() -> None:
    with pytest.raises(DemoClockError, match="APP_ENV=demo"):
        DemoClock("2026-10-03T14:10", app_env="production")


def test_build_clock_selects_demo_only_when_set() -> None:
    assert build_clock(app_env="dev", demo_now=None, mode="ticking").source == "system"
    clock = build_clock(app_env="demo", demo_now="2026-10-03T14:10", mode="frozen")
    assert clock.source == "demo"


def test_naive_demo_now_is_local_time_per_tenant() -> None:
    clock = DemoClock("2026-10-03T14:10", app_env="demo", mode="frozen")
    chi, den = clock.now(CHI), clock.now(DEN)
    assert (chi.hour, chi.minute) == (den.hour, den.minute) == (14, 10)
    assert chi.strftime("%A") == "Saturday"
    # Same wall time, different instants: Denver is one hour behind Chicago.
    assert clock.now_utc(DEN) - clock.now_utc(CHI) == timedelta(hours=1)
    assert clock.now_utc(CHI) == datetime(2026, 10, 3, 19, 10, tzinfo=UTC)


def test_offset_demo_now_is_one_instant() -> None:
    clock = DemoClock("2026-10-03T14:10-05:00", app_env="demo", mode="frozen")
    assert clock.now_utc(CHI) == clock.now_utc(DEN) == datetime(2026, 10, 3, 19, 10, tzinfo=UTC)
    assert clock.now(DEN).hour == 13


def test_ticking_vs_frozen() -> None:
    t = [100.0]
    ticking = DemoClock("2026-10-03T14:10", app_env="demo", mode="ticking", monotonic=lambda: t[0])
    frozen = DemoClock("2026-10-03T14:10", app_env="demo", mode="frozen", monotonic=lambda: t[0])
    t[0] += 90
    assert ticking.now(CHI) == datetime(2026, 10, 3, 14, 11, 30, tzinfo=CHI)
    assert frozen.now(CHI) == datetime(2026, 10, 3, 14, 10, tzinfo=CHI)


def test_rejects_spring_forward_gap() -> None:
    clock = DemoClock("2027-03-14T02:30", app_env="demo", mode="frozen")
    with pytest.raises(DemoClockError, match="does not exist"):
        clock.validate_for(CHI)


def test_rejects_fall_back_fold() -> None:
    clock = DemoClock("2026-11-01T01:30", app_env="demo", mode="frozen")
    with pytest.raises(DemoClockError, match="ambiguous"):
        clock.validate_for(CHI)


def test_rejects_garbage() -> None:
    with pytest.raises(DemoClockError, match="ISO 8601"):
        DemoClock("next saturday", app_env="demo")
