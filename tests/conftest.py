from __future__ import annotations

import copy
import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from alembic import command
from alembic.config import Config

from receptionist.config.loader import LoadedTenant, load_tenant_file
from receptionist.settings import Settings

ROOT = Path(__file__).resolve().parents[1]
TENANTS_DIR = ROOT / "tenants"
JOLLY = "jolly-brothers-round-rock"
CEDAR = "cedar-ridge-denver"


def make_settings(**overrides: Any) -> Settings:
    base: dict[str, Any] = {
        "app_env": "test",
        "tenants_dir": TENANTS_DIR,
        "log_format": "json",
    }
    base.update(overrides)
    return Settings(_env_file=None, **base)  # type: ignore[call-arg]


@pytest.fixture
def jolly() -> LoadedTenant:
    return load_tenant_file(TENANTS_DIR / f"{JOLLY}.json")


@pytest.fixture
def cedar() -> LoadedTenant:
    return load_tenant_file(TENANTS_DIR / f"{CEDAR}.json")


@pytest.fixture
def jolly_raw() -> dict[str, Any]:
    return json.loads((TENANTS_DIR / f"{JOLLY}.json").read_text())


@pytest.fixture
def write_tenant(tmp_path: Path) -> Callable[[dict[str, Any], str | None], Path]:
    """Write a (possibly modified) tenant config into a temp tenants dir."""

    def _write(raw: dict[str, Any], filename: str | None = None) -> Path:
        d = tmp_path / "tenants"
        d.mkdir(exist_ok=True)
        path = d / (filename or f"{raw['client_id']}.json")
        path.write_text(json.dumps(copy.deepcopy(raw)))
        return path

    return _write


def migrate(url: str, revision: str = "head") -> None:
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.attributes["database_url"] = url
    cfg.attributes["configure_logger"] = False
    command.upgrade(cfg, revision)


@pytest.fixture
def db_url(tmp_path: Path) -> str:
    """A freshly migrated SQLite database (sync fixture: Alembic runs its own event loop)."""
    url = f"sqlite+aiosqlite:///{tmp_path / 'test.db'}"
    migrate(url)
    return url
