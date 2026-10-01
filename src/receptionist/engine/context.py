"""Per-turn context handed to tools."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from receptionist.booking.base import BookingProvider
from receptionist.booking.breaker import CircuitBreaker
from receptionist.clock import Clock
from receptionist.config.loader import LoadedTenant
from receptionist.config.models import TenantConfig
from receptionist.engine.locales import Locale
from receptionist.engine.state import ConversationState
from receptionist.settings import Settings


@dataclass
class TurnContext:
    tenant: LoadedTenant
    conversation_id: str
    session: AsyncSession
    state: ConversationState
    clock: Clock
    booking: BookingProvider
    breaker: CircuitBreaker
    locale: Locale
    settings: Settings
    turn_id: str
    turn_index: int
    last_agent_text: str = ""  # everything the agent said since the previous user message
    current_user_text: str = ""
    caller_id_phone: str | None = None
    notes: list[str] = field(default_factory=list)

    @property
    def cfg(self) -> TenantConfig:
        return self.tenant.config

    @property
    def now_local(self) -> datetime:
        return self.clock.now(self.cfg.tz)
