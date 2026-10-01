"""Per-tenant booking provider + circuit breaker."""

from __future__ import annotations

from receptionist.booking.base import BookingProvider
from receptionist.booking.breaker import CircuitBreaker
from receptionist.booking.fake import FakeBookingProvider
from receptionist.config.loader import TenantRegistry


class BookingProviders:
    def __init__(
        self, tenants: TenantRegistry, overrides: dict[str, BookingProvider] | None = None
    ) -> None:
        self._tenants = tenants
        self._providers: dict[str, BookingProvider] = dict(overrides or {})
        self._breakers: dict[str, CircuitBreaker] = {}

    def get(self, client_id: str) -> tuple[BookingProvider, CircuitBreaker]:
        if client_id not in self._providers:
            cfg = self._tenants[client_id].config
            if cfg.booking.provider == "fake":
                self._providers[client_id] = FakeBookingProvider(cfg)
            else:
                raise NotImplementedError("The Cal.com provider arrives in Phase 3.")
        breaker = self._breakers.setdefault(client_id, CircuitBreaker())
        return self._providers[client_id], breaker

    def set(self, client_id: str, provider: BookingProvider) -> None:
        self._providers[client_id] = provider
        self._breakers[client_id] = CircuitBreaker()
