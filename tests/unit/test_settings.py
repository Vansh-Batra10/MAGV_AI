import pytest
from pydantic import ValidationError

from tests.conftest import make_settings


@pytest.mark.parametrize("env", ["dev", "test", "production"])
def test_demo_now_refused_outside_demo_mode(env: str) -> None:
    with pytest.raises(ValidationError, match="DEMO_NOW is set but APP_ENV"):
        make_settings(app_env=env, demo_now="2026-10-03T14:10", log_hash_salt="s3cret")


def test_demo_now_allowed_in_demo_mode() -> None:
    s = make_settings(app_env="demo", demo_now="2026-10-03T14:10")
    assert s.demo_now == "2026-10-03T14:10"


def test_blank_demo_now_is_treated_as_unset() -> None:
    assert make_settings(app_env="dev", demo_now="  ").demo_now is None


def test_demo_mode_refused_on_postgres_without_explicit_flag() -> None:
    url = "postgresql+psycopg://u:p@localhost/db"
    with pytest.raises(ValidationError, match="ALLOW_DEMO_ON_POSTGRES"):
        make_settings(app_env="demo", database_url=url)
    assert make_settings(app_env="demo", database_url=url, allow_demo_on_postgres=True)


def test_production_requires_real_log_salt() -> None:
    with pytest.raises(ValidationError, match="LOG_HASH_SALT"):
        make_settings(app_env="production")
    assert make_settings(app_env="production", log_hash_salt="a-real-secret")


def test_default_models() -> None:
    s = make_settings()
    assert s.model_live == "claude-haiku-4-5"
    assert s.model_summary == "claude-sonnet-5-5"
    assert s.model_judge == "claude-opus-5-5"
    assert set(s.model_prices) >= {"claude-haiku-4-5", "claude-sonnet-5-5", "claude-opus-5-5"}


def test_api_key_alias_precedence(monkeypatch: pytest.MonkeyPatch) -> None:
    from receptionist.settings import Settings

    monkeypatch.delenv("RECEPTIONIST_ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "plain")
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    assert s.anthropic_api_key is not None and s.anthropic_api_key.get_secret_value() == "plain"
    monkeypatch.setenv("RECEPTIONIST_ANTHROPIC_API_KEY", "preferred")
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    assert s.anthropic_api_key is not None
    assert s.anthropic_api_key.get_secret_value() == "preferred"
