"""Process-wide settings, loaded from environment variables (and `.env` in development).

Secrets live only here (env), never in tenant JSON. Tenant configs refer to env var *names*.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, BaseModel, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["dev", "test", "demo", "production"]

_DEV_HASH_SALT = "dev-only-salt-change-me"


class ModelPrice(BaseModel):
    """USD per million tokens."""

    input: float
    output: float
    cache_read: float
    cache_write: float


# Anthropic first-party list prices (USD / MTok). Config, not code: override with MODEL_PRICES.
DEFAULT_MODEL_PRICES: dict[str, ModelPrice] = {
    "claude-haiku-4-5": ModelPrice(input=1.0, output=5.0, cache_read=0.10, cache_write=1.25),
    "claude-sonnet-5-5": ModelPrice(input=2.0, output=10.0, cache_read=0.20, cache_write=2.50),
    "claude-opus-5-5": ModelPrice(input=4.0, output=20.0, cache_read=0.20, cache_write=5.00),
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", populate_by_name=True
    )

    app_env: AppEnv = "dev"
    database_url: str = "sqlite+aiosqlite:///./var/receptionist.db"
    tenants_dir: Path = Path("tenants")
    locales_dir: Path = Path("locales")

    log_level: str = "INFO"
    log_format: Literal["json", "console"] = "json"
    log_hash_salt: SecretStr = SecretStr(_DEV_HASH_SALT)

    # Demo clock override. Only honoured when APP_ENV=demo (enforced below and in DemoClock).
    demo_now: str | None = None
    demo_clock_mode: Literal["ticking", "frozen"] = "ticking"
    allow_demo_on_postgres: bool = False

    # Models per purpose (DESIGN.md section 5).
    model_live: str = "claude-haiku-4-5"
    model_summary: str = "claude-sonnet-5-5"
    model_judge: str = "claude-opus-5-5"
    model_caller_sim: str = "claude-sonnet-5-5"
    model_prices: dict[str, ModelPrice] = Field(default_factory=lambda: dict(DEFAULT_MODEL_PRICES))

    # RECEPTIONIST_ANTHROPIC_API_KEY wins: Claude Code cloud environments reserve
    # ANTHROPIC_API_KEY for their own auth and don't pass it to the session.
    anthropic_api_key: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("RECEPTIONIST_ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY"),
    )
    llm_live_timeout_s: float = 8.0
    max_tool_rounds: int = 3

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @model_validator(mode="after")
    def _guard_environment(self) -> Settings:
        if self.demo_now is not None and self.demo_now.strip() == "":
            self.demo_now = None
        if self.demo_now is not None and self.app_env != "demo":
            raise ValueError(
                f"DEMO_NOW is set but APP_ENV={self.app_env!r}. "
                "The demo clock can only be enabled with APP_ENV=demo."
            )
        if self.app_env == "demo" and not self.is_sqlite and not self.allow_demo_on_postgres:
            raise ValueError(
                "APP_ENV=demo with a non-SQLite DATABASE_URL is refused "
                "(set ALLOW_DEMO_ON_POSTGRES=1 if this is really a demo database)."
            )
        if self.app_env == "production" and (
            self.log_hash_salt.get_secret_value() == _DEV_HASH_SALT
        ):
            raise ValueError("LOG_HASH_SALT must be set to a secret value in production.")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
