from datetime import date, datetime

import pytest
from pydantic import ValidationError

from receptionist.config.hours import agent_active, is_open, next_business_day_open, next_open
from receptionist.config.loader import LoadedTenant
from receptionist.config.models import TenantConfig


def chi(cfg: TenantConfig, *args: int) -> datetime:
    return datetime(*args, tzinfo=cfg.tz)


def test_open_close_boundaries(jolly: LoadedTenant) -> None:
    cfg = jolly.config
    assert is_open(cfg, chi(cfg, 2026, 10, 5, 8, 0))  # Monday 8:00 opens
    assert is_open(cfg, chi(cfg, 2026, 10, 5, 16, 59))
    assert not is_open(cfg, chi(cfg, 2026, 10, 5, 17, 0))  # close is exclusive
    assert not is_open(cfg, chi(cfg, 2026, 10, 5, 7, 59))
    assert not is_open(cfg, chi(cfg, 2026, 10, 3, 11, 0))  # Saturday closed
    assert not is_open(cfg, chi(cfg, 2026, 10, 4, 11, 0))  # Sunday closed


def test_is_open_converts_from_other_zones(jolly: LoadedTenant) -> None:
    from zoneinfo import ZoneInfo

    # 14:30 UTC on a Monday = 09:30 CDT
    assert is_open(jolly.config, datetime(2026, 10, 5, 14, 30, tzinfo=ZoneInfo("UTC")))


def test_naive_rejected(jolly: LoadedTenant) -> None:
    with pytest.raises(ValueError, match="aware"):
        is_open(jolly.config, datetime(2026, 10, 5, 9, 0))


def test_next_open_over_weekend(jolly: LoadedTenant) -> None:
    cfg = jolly.config
    assert next_open(cfg, chi(cfg, 2026, 10, 2, 18, 0)) == chi(cfg, 2026, 10, 5, 8, 0)


def test_next_open_across_dst_fall_back(jolly: LoadedTenant) -> None:
    """Friday Oct 30 2026 (CDT, -5) to Monday Nov 2 2026 (CST, -6): still 08:00 local."""
    cfg = jolly.config
    nxt = next_open(cfg, chi(cfg, 2026, 10, 30, 18, 0))
    assert nxt == chi(cfg, 2026, 11, 2, 8, 0)
    assert nxt.utcoffset().total_seconds() == -6 * 3600


def test_next_open_across_dst_spring_forward(jolly: LoadedTenant) -> None:
    cfg = jolly.config
    nxt = next_open(cfg, chi(cfg, 2027, 3, 12, 18, 0))
    assert nxt == chi(cfg, 2027, 3, 15, 8, 0)
    assert nxt.utcoffset().total_seconds() == -5 * 3600


def test_next_business_day_open_skips_today(jolly: LoadedTenant) -> None:
    cfg = jolly.config
    # Monday 9 AM caller: the earliest slot is Tuesday 8 AM, not later today.
    assert next_business_day_open(cfg, chi(cfg, 2026, 10, 5, 9, 0)) == chi(cfg, 2026, 10, 6, 8, 0)
    # Saturday afternoon caller: Monday 8 AM.
    assert next_business_day_open(cfg, chi(cfg, 2026, 10, 3, 14, 10)) == chi(cfg, 2026, 10, 5, 8, 0)


def test_holidays_are_closed(jolly: LoadedTenant) -> None:
    hours = jolly.config.business_hours.model_copy(update={"holidays": [date(2026, 10, 5)]})
    cfg = jolly.config.model_copy(update={"business_hours": hours})
    assert not is_open(cfg, chi(cfg, 2026, 10, 5, 10, 0))
    assert next_open(cfg, chi(cfg, 2026, 10, 2, 18, 0)) == chi(cfg, 2026, 10, 6, 8, 0)


@pytest.mark.parametrize(
    ("mode", "open_now", "overflow", "expected"),
    [
        ("always", True, False, True),
        ("after_hours", True, False, False),
        ("after_hours", False, False, True),
        ("overflow", False, False, False),
        ("overflow", True, True, True),
        ("after_hours_and_overflow", True, False, False),
        ("after_hours_and_overflow", True, True, True),
        ("after_hours_and_overflow", False, False, True),
    ],
)
def test_agent_active(
    jolly: LoadedTenant, mode: str, open_now: bool, overflow: bool, expected: bool
) -> None:
    cfg = jolly.config.model_copy(update={"agent_mode": mode})
    at = chi(cfg, 2026, 10, 5, 10, 0) if open_now else chi(cfg, 2026, 10, 3, 10, 0)
    assert agent_active(cfg, at, forwarded_overflow=overflow) is expected


def test_config_is_immutable(jolly: LoadedTenant) -> None:
    with pytest.raises(ValidationError):
        jolly.config.agent_mode = "always"  # type: ignore[misc]
