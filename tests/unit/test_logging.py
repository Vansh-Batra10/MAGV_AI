import json
import logging

import pytest
import structlog

from receptionist.logging import Redactor, configure_logging, get_logger


@pytest.fixture
def redactor() -> Redactor:
    return Redactor("test-salt")


def test_phone_keys_keep_last_four_and_hash(redactor: Redactor) -> None:
    out = redactor.value("caller_phone_e164", "+15125550198")
    assert out.startswith("***0198#")
    assert "5125550198" not in out
    # Same number, same hash (correlatable); different salt, different hash.
    assert out == redactor.value("phone", "(512) 555-0198")
    assert out != Redactor("other").value("phone", "+15125550198")


def test_email_keys_are_hashed(redactor: Redactor) -> None:
    out = redactor.value("attendee_email", "Jane.Doe@Example.com")
    assert out.startswith("email#") and "example" not in out.lower()
    assert out == redactor.value("email", "jane.doe@example.com")


def test_names_addresses_transcripts_dropped(redactor: Redactor) -> None:
    for key in ("caller_name", "service_address", "transcript", "user_text"):
        assert redactor.value(key, "2104 Oak Street, Round Rock") == "[redacted]"


def test_free_text_is_scrubbed(redactor: Redactor) -> None:
    out = redactor.value("event", "call me at 512-555-0198 or jane@example.com please")
    assert "555-0198" not in out and "jane@example.com" not in out
    assert "***0198#" in out and "email#" in out


def test_nested_structures(redactor: Redactor) -> None:
    out = redactor.value(
        "args", {"attendee": {"phone": "+15125550198", "name": "Jane"}, "slots": ["s1"]}
    )
    assert out["attendee"]["phone"].startswith("***0198#")
    assert out["attendee"]["name"] == "[redacted]"
    assert out["slots"] == ["s1"]


def test_non_pii_numbers_untouched(redactor: Redactor) -> None:
    assert redactor.value("ttft_ms", 640) == 640
    assert redactor.value("event", "turn 3 took 640 ms") == "turn 3 took 640 ms"


def test_end_to_end_json_log_line(capsys: pytest.CaptureFixture[str]) -> None:
    configure_logging(level="INFO", fmt="json", hash_salt="test-salt")
    with structlog.contextvars.bound_contextvars(tenant_id="jolly-brothers-round-rock"):
        get_logger("t").info("caller_identified", caller_phone="+15125550198", turn=2)
    line = capsys.readouterr().out.strip().splitlines()[-1]
    data = json.loads(line)
    assert data["event"] == "caller_identified"
    assert data["tenant_id"] == "jolly-brothers-round-rock"
    assert data["caller_phone"].startswith("***0198#")
    assert "5125550198" not in line
    logging.getLogger().handlers.clear()
