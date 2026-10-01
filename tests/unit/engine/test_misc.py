import pytest

from receptionist.booking.placeholder import PlaceholderTemplateError, render_placeholder
from receptionist.engine.fillers import pick_filler
from receptionist.engine.locales import load_locale
from receptionist.engine.state import ConversationState
from tests.conftest import ROOT

EN = load_locale(ROOT / "locales", "en")


def test_filler_deterministic_and_not_repeated() -> None:
    a = pick_filler(EN, "check_availability", seed="c1:1", last_used=None, second_in_turn=False)
    assert a == pick_filler(
        EN, "check_availability", seed="c1:1", last_used=None, second_in_turn=False
    )
    for i in range(20):
        nxt = pick_filler(
            EN, "check_availability", seed=f"c1:{i}", last_used=a, second_in_turn=False
        )
        assert nxt != a
    assert (
        pick_filler(EN, "create_booking", seed="x", last_used=None, second_in_turn=True)
        == "One more moment."
    )


def test_spanish_locale_has_callback_flow() -> None:
    es = load_locale(ROOT / "locales", "es")
    assert "{business}" not in es.t("capture.intro", business="Jolly Brothers Services")


def test_placeholder_email() -> None:
    tpl = "myname+jb-{session_short}@gmail.com"
    assert (
        render_placeholder(tpl, "C7F3A1B2-0000-4000-8000-000000000000")
        == "myname+jb-c7f3a1@gmail.com"
    )


@pytest.mark.parametrize(
    "tpl",
    ["myname@gmail.com", "{x}@gmail.com", "jb-{session_short}", "{session_short}@{other}.com"],
)
def test_bad_placeholder_templates(tpl: str) -> None:
    with pytest.raises(PlaceholderTemplateError):
        render_placeholder(tpl, "abc")


def test_state_round_trips_json() -> None:
    s = ConversationState()
    s.caller.name = "Pat"
    assert ConversationState.model_validate_json(s.model_dump_json()) == s
    assert s.missing_for_booking() == ["phone", "address", "issue_summary"]
