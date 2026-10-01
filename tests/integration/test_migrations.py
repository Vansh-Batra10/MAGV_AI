from pathlib import Path

from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from receptionist.db import models  # noqa: F401
from receptionist.db.base import Base
from tests.conftest import migrate

EXPECTED_TABLES = {
    "tenants",
    "conversations",
    "messages",
    "turns",
    "tool_calls",
    "bookings",
    "callback_requests",
    "leads",
    "alerts",
    "summaries",
    "outbound_emails",
    "jobs",
    "webhook_events",
    "alembic_version",
}


def _sync_url(async_url: str) -> str:
    return async_url.replace("sqlite+aiosqlite", "sqlite")


def test_upgrade_creates_all_tables(db_url: str) -> None:
    engine = create_engine(_sync_url(db_url))
    assert set(inspect(engine).get_table_names()) == EXPECTED_TABLES
    engine.dispose()


def test_models_and_migrations_in_sync(db_url: str) -> None:
    """Fails if someone changes a model without generating a migration."""
    engine = create_engine(_sync_url(db_url))
    with engine.connect() as conn:
        ctx = MigrationContext.configure(conn, opts={"compare_type": True})
        diff = compare_metadata(ctx, Base.metadata)
    engine.dispose()
    assert diff == []


def test_downgrade_to_base_and_back(tmp_path: Path) -> None:
    url = f"sqlite+aiosqlite:///{tmp_path / 'rt.db'}"
    migrate(url, "head")
    from alembic import command
    from alembic.config import Config

    from tests.conftest import ROOT

    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.attributes.update(database_url=url, configure_logger=False)
    command.downgrade(cfg, "base")
    engine = create_engine(_sync_url(url))
    assert set(inspect(engine).get_table_names()) == {"alembic_version"}
    engine.dispose()
    migrate(url, "head")
