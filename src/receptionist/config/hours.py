"""Business-hours logic. All inputs are aware datetimes; results are in the tenant timezone."""

from __future__ import annotations

from datetime import datetime, timedelta

from receptionist.config.models import WEEKDAYS, TenantConfig


def _require_aware(at: datetime) -> None:
    if at.tzinfo is None:
        raise ValueError("expected an aware datetime")


def is_open(cfg: TenantConfig, at: datetime) -> bool:
    """True if the business is open at instant `at` (open inclusive, close exclusive)."""
    _require_aware(at)
    local = at.astimezone(cfg.tz)
    if local.date() in cfg.business_hours.holidays:
        return False
    t = local.time().replace(tzinfo=None)
    return any(r.open <= t < r.close for r in cfg.business_hours.ranges(WEEKDAYS[local.weekday()]))


def next_open(cfg: TenantConfig, after: datetime, *, max_days: int = 21) -> datetime:
    """The next opening instant strictly after `after`, in tenant local time.

    Opening times are wall-clock times, so DST transitions are handled by building each
    candidate in local time.
    """
    _require_aware(after)
    local = after.astimezone(cfg.tz)
    for offset in range(max_days + 1):
        day = local.date() + timedelta(days=offset)
        if day in cfg.business_hours.holidays:
            continue
        for r in cfg.business_hours.ranges(WEEKDAYS[day.weekday()]):
            candidate = datetime.combine(day, r.open, tzinfo=cfg.tz)
            if candidate > local:
                return candidate
    raise ValueError(f"no opening found within {max_days} days")


def next_business_day_open(cfg: TenantConfig, at: datetime) -> datetime:
    """Opening time of the first business day after the local date of `at`.

    This is the "earliest slot: next business day 08:00" rule: even a Monday 9 AM caller is
    offered Tuesday onwards.
    """
    _require_aware(at)
    local = at.astimezone(cfg.tz)
    end_of_today = datetime.combine(local.date() + timedelta(days=1), datetime.min.time(), cfg.tz)
    return next_open(cfg, end_of_today - timedelta(microseconds=1))


def agent_active(cfg: TenantConfig, at: datetime, *, forwarded_overflow: bool = False) -> bool:
    """Whether the agent should take the conversation, given the tenant's agent_mode."""
    closed = not is_open(cfg, at)
    match cfg.agent_mode:
        case "always":
            return True
        case "after_hours":
            return closed
        case "overflow":
            return forwarded_overflow
        case "after_hours_and_overflow":
            return closed or forwarded_overflow
