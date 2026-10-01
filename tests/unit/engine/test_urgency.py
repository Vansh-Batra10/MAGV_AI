"""Season-aware urgency rules (DESIGN.md 3.8, rev 3 change 2)."""

from datetime import date

import pytest

from receptionist.config.loader import LoadedTenant
from receptionist.engine.urgency import assess, max_urgency

HOT = date(2026, 7, 15)  # inside May 1 - Oct 31
COLD = date(2026, 12, 15)  # outside
HOT_EDGES = [date(2026, 5, 1), date(2026, 10, 31)]
COLD_EDGES = [date(2026, 4, 30), date(2026, 11, 1)]

VULNERABLE_NO_COOLING = [
    "AC is dead and my mom is home, she's 82",
    "the a/c stopped working and my grandmother lives with us",
    "air conditioner quit, I have a newborn",
    "our AC isn't cooling and my husband is on oxygen",
    "no AC, my dad is 79 years old",
    "the air's not working and my wife is pregnant",
    "AC went out. I'm disabled and can't leave the house",
    "ac is blowing warm air and my son has a medical condition",
    "My AC died and there's a 6 month old baby here",
    "The A.C. broke. My mother, she is 91, is here alone",
]
NO_COOLING_ONLY = [
    "My AC is dead",
    "the air conditioning stopped working this morning",
    "it's blowing warm air",
    "the ac won't turn on",
    "no cold air coming out of the vents",
]


@pytest.mark.parametrize("text", VULNERABLE_NO_COOLING)
def test_vulnerable_no_cooling_is_emergency_in_hot_season(jolly: LoadedTenant, text: str) -> None:
    result = assess(jolly.config, text, HOT)
    assert result.level == "emergency", [m.rule_id for m in result.matches]
    assert "no-cooling-vulnerable" in {m.rule_id for m in result.matches}
    assert result.alert_on_call is True


@pytest.mark.parametrize("text", VULNERABLE_NO_COOLING)
def test_vulnerable_no_cooling_is_urgent_outside_hot_season(jolly: LoadedTenant, text: str) -> None:
    result = assess(jolly.config, text, COLD)
    assert result.level == "urgent"
    assert result.alert_on_call is False


@pytest.mark.parametrize("text", NO_COOLING_ONLY)
def test_no_cooling_without_vulnerable_person(jolly: LoadedTenant, text: str) -> None:
    assert assess(jolly.config, text, HOT).level == "urgent"
    assert assess(jolly.config, text, COLD).level == "routine"


def test_heat_never_needs_to_be_mentioned(jolly: LoadedTenant) -> None:
    text = "AC is dead and my mom is home, she's 82"
    assert "heat" not in text and "hot" not in text
    assert assess(jolly.config, text, HOT).level == "emergency"


@pytest.mark.parametrize("day", HOT_EDGES)
def test_season_edges_inclusive(jolly: LoadedTenant, day: date) -> None:
    assert assess(jolly.config, "AC is dead, my grandpa is here", day).level == "emergency"


@pytest.mark.parametrize("day", COLD_EDGES)
def test_outside_season_edges(jolly: LoadedTenant, day: date) -> None:
    assert assess(jolly.config, "AC is dead, my grandpa is here", day).level == "urgent"


def test_accumulated_text_across_turns(jolly: LoadedTenant) -> None:
    turns = ["Hi, my AC is dead.", "Yes. Also my mom is home, she's 82."]
    assert assess(jolly.config, turns[0], HOT).level == "urgent"
    assert assess(jolly.config, " ".join(turns), HOT).level == "emergency"


@pytest.mark.parametrize(
    "text",
    [
        "my mom is 45 and the AC is dead",  # not elderly
        "it's 82 degrees inside and the ac is dead",  # a temperature, not an age
        "the thermostat display is blank but the AC works",
    ],
)
def test_no_false_vulnerable_match(jolly: LoadedTenant, text: str) -> None:
    result = assess(jolly.config, text, HOT)
    assert "no-cooling-vulnerable" not in {m.rule_id for m in result.matches}


def test_gas_smell_has_safety_script_and_alert(jolly: LoadedTenant) -> None:
    result = assess(jolly.config, "I think I smell gas near the furnace", COLD)
    assert result.level == "emergency"
    assert result.alert_on_call
    [(rule_id, script)] = result.safety_scripts
    assert rule_id == "gas-smell" and "leave the house" in script.en


def test_no_heat_below_freezing(jolly: LoadedTenant) -> None:
    assert assess(jolly.config, "no heat and it's below freezing", COLD).level == "emergency"


def test_routine_request_has_no_rule_level(jolly: LoadedTenant) -> None:
    assert assess(jolly.config, "I'd like a tune-up next week", HOT).level is None


def test_max_urgency() -> None:
    assert max_urgency(None, "routine", "emergency", "urgent") == "emergency"
    assert max_urgency(None, None) is None
