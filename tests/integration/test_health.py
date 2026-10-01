import pytest
from fastapi.testclient import TestClient

from receptionist.config.loader import ConfigError
from receptionist.main import StartupError, create_app
from tests.conftest import make_settings


def test_healthz_reports_db_tenants_and_clock(db_url: str) -> None:
    app = create_app(make_settings(database_url=db_url))
    with TestClient(app) as client:
        r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok" and body["db"] == "ok"
    assert body["clock"]["source"] == "system"
    assert {t["client_id"] for t in body["tenants"]} == {
        "jolly-brothers-round-rock",
        "cedar-ridge-denver",
    }
    assert r.headers["x-request-id"]


def test_healthz_with_demo_clock(db_url: str) -> None:
    settings = make_settings(
        app_env="demo", database_url=db_url, demo_now="2026-10-03T14:10", demo_clock_mode="frozen"
    )
    with TestClient(create_app(settings)) as client:
        body = client.get("/healthz").json()
    assert body["clock"]["source"] == "demo"
    jolly = next(t for t in body["tenants"] if t["client_id"] == "jolly-brothers-round-rock")
    assert jolly["local_now"] == "2026-10-03T14:10:00-05:00"
    assert jolly["open_now"] is False  # Saturday
    assert jolly["todos"] == 4


def test_demo_now_in_gap_refuses_to_boot() -> None:
    from receptionist.clock import DemoClockError

    settings = make_settings(app_env="demo", demo_now="2027-03-14T02:30")
    with pytest.raises(DemoClockError):
        create_app(settings)


def test_invalid_tenant_config_refuses_to_boot(tmp_path) -> None:  # type: ignore[no-untyped-def]
    (tmp_path / "bad.json").write_text("{}")
    with pytest.raises(ConfigError):
        create_app(make_settings(tenants_dir=tmp_path))


def test_missing_schema_refuses_to_start(tmp_path) -> None:  # type: ignore[no-untyped-def]
    app = create_app(make_settings(database_url=f"sqlite+aiosqlite:///{tmp_path / 'empty.db'}"))
    with pytest.raises(StartupError, match="make migrate"), TestClient(app):
        pass
