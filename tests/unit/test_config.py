import copy
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

from receptionist.config.loader import ConfigError, load_tenant_file, load_tenants
from tests.conftest import TENANTS_DIR

Writer = Callable[..., Path]


def test_shipped_tenants_load() -> None:
    registry = load_tenants(TENANTS_DIR)
    assert list(registry) == ["cedar-ridge-denver", "jolly-brothers-round-rock"]
    jolly = registry["jolly-brothers-round-rock"].config
    assert jolly.business.name == "Jolly Brothers Services"
    assert jolly.timezone == "America/Chicago"
    assert jolly.agent_mode == "after_hours_and_overflow"
    assert jolly.booking.calendar_owner == "demo_owner"
    assert jolly.booking.slot_length_min == 120
    assert jolly.pricing_policy.mode == "no_quotes"
    assert jolly.language_support.es == "callback_only"
    assert {r.id for r in jolly.emergency_rules} >= {
        "gas-smell",
        "burning-smoke",
        "no-heat-freezing",
    }
    assert registry.all_todos().keys() == {"jolly-brothers-round-rock"}


def test_disclosure_is_verbatim_from_owner() -> None:
    cfg = load_tenants(TENANTS_DIR)["jolly-brothers-round-rock"].config
    assert cfg.disclosure.en == (
        "Hi, thanks for calling Jolly Brothers Services. "
        "I'm their AI assistant, and this call may be recorded."
    )


def test_config_hash_is_stable(jolly_raw: dict[str, Any], write_tenant: Writer) -> None:
    a = load_tenant_file(write_tenant(jolly_raw))
    reordered = dict(reversed(list(jolly_raw.items())))
    b = load_tenant_file(write_tenant(reordered))
    assert a.config_hash == b.config_hash


def _mutate(raw: dict[str, Any], dotted: str, value: Any) -> dict[str, Any]:
    raw = copy.deepcopy(raw)
    node = raw
    *parents, leaf = dotted.split(".")
    for p in parents:
        node = node[int(p)] if p.isdigit() else node[p]
    node[leaf] = value  # type: ignore[index]
    return raw


@pytest.mark.parametrize(
    ("path", "value", "expected_loc"),
    [
        ("timezone", "America/Austin", "timezone"),
        ("booking.offer_count", 3, "booking.offer_count"),
        ("business_hours.mon", ["08:00-12:00", "11:00-17:00"], "business_hours"),
        ("business_hours.tue", ["17:00-08:00"], "business_hours"),
        ("business_hours.wed", ["8am-5pm"], "business_hours"),
        ("on_call.phone_e164", "512-555-0142", "on_call.phone_e164"),
        ("booking.calendar_owner", "tenant", "<root>"),
        ("agent_mode", "sometimes", "agent_mode"),
        ("unexpected_field", True, "unexpected_field"),
        ("notifications.owner_email_env", "lower_case", "notifications.owner_email_env"),
    ],
)
def test_invalid_configs_fail_with_path(
    jolly_raw: dict[str, Any], write_tenant: Writer, path: str, value: Any, expected_loc: str
) -> None:
    bad = _mutate(jolly_raw, path, value)
    with pytest.raises(ConfigError) as exc:
        load_tenant_file(write_tenant(bad))
    assert f": {expected_loc}" in str(exc.value)


def test_no_quotes_with_amounts_rejected(jolly_raw: dict[str, Any], write_tenant: Writer) -> None:
    bad = _mutate(
        jolly_raw,
        "pricing_policy.quotable_amounts",
        [{"label": "diagnostic", "amount_usd": 89, "spoken": "eighty-nine dollars"}],
    )
    with pytest.raises(ConfigError, match="must be empty"):
        load_tenant_file(write_tenant(bad))


def test_calcom_provider_requires_env_names(
    jolly_raw: dict[str, Any], write_tenant: Writer
) -> None:
    bad = _mutate(jolly_raw, "booking.provider", "calcom")
    bad["booking"].pop("api_key_env")
    with pytest.raises(ConfigError, match="api_key_env"):
        load_tenant_file(write_tenant(bad))


def test_filename_must_match_client_id(jolly_raw: dict[str, Any], write_tenant: Writer) -> None:
    with pytest.raises(ConfigError, match="file name must be"):
        load_tenant_file(write_tenant(jolly_raw, "jolly.json"))


def test_duplicate_client_ids_and_all_errors_reported(
    jolly_raw: dict[str, Any], write_tenant: Writer, tmp_path: Path
) -> None:
    write_tenant(jolly_raw)
    write_tenant(_mutate(jolly_raw, "timezone", "Nowhere/Land"), "cedar.json")
    with pytest.raises(ConfigError) as exc:
        load_tenants(tmp_path / "tenants")
    assert "cedar.json: timezone" in str(exc.value)


def test_invalid_json_reported(write_tenant: Writer, tmp_path: Path) -> None:
    d = tmp_path / "tenants"
    d.mkdir()
    (d / "broken.json").write_text("{not json")
    with pytest.raises(ConfigError, match="cannot read JSON"):
        load_tenants(d)
