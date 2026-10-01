"""Programmatic Alembic upgrade (used by tests and the eval runner)."""

from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config

ROOT = Path(__file__).resolve().parents[3]


def upgrade(url: str, revision: str = "head") -> None:
    """Run migrations. Must be called outside a running event loop (Alembic uses asyncio.run)."""
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.attributes["database_url"] = url
    cfg.attributes["configure_logger"] = False
    command.upgrade(cfg, revision)
