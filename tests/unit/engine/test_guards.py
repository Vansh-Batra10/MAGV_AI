import pytest

from receptionist.config.loader import LoadedTenant
from receptionist.engine.guards import OutputGuard, SentenceChunker


def test_chunker_splits_sentences_and_long_clauses() -> None:
    c = SentenceChunker()
    assert c.feed("Oh no, that's no fun. Let me") == ["Oh no, that's no fun."]
    assert c.feed(" help. ") == ["Let me help."]
    long = "one two three four five six seven eight nine ten eleven twelve thirteen, and more"
    assert c.feed(long) == [
        "one two three four five six seven eight nine ten eleven twelve thirteen,"
    ]
    assert c.flush() == ["and more"]


def guard(tenant: LoadedTenant, booked: bool = False) -> OutputGuard:
    return OutputGuard(
        tenant.config,
        booking_confirmed=booked,
        blocked_line="Let me finish getting that on the schedule.",
    )


@pytest.mark.parametrize(
    "text",
    [
        "You're all set for Monday at 8 AM.",
        "I've booked you for Monday.",
        "Your appointment is confirmed.",
        "Great, you're booked!",
        "Perfect, got you down for Monday.",
    ],
)
def test_booked_claim_blocked_until_confirmed(jolly: LoadedTenant, text: str) -> None:
    r = guard(jolly).check(text)
    assert r.text == "Let me finish getting that on the schedule." and "booked_claim" in r.triggers
    assert guard(jolly, booked=True).check(text).text == text


def test_offering_is_not_a_booked_claim(jolly: LoadedTenant) -> None:
    text = "I can do Monday at 8 AM or 10 AM. Which works better?"
    assert guard(jolly).check(text).triggers == []


@pytest.mark.parametrize(
    "text",
    [
        "A diagnostic is usually $89.",
        "That runs about 150 dollars.",
        "It's around two hundred dollars.",
    ],
)
def test_prices_blocked_for_no_quotes_tenant(jolly: LoadedTenant, text: str) -> None:
    r = guard(jolly).check(text)
    assert "price" in r.triggers
    assert r.text == jolly.config.pricing_policy.deflection_line


def test_quotable_amount_allowed(cedar: LoadedTenant) -> None:
    assert guard(cedar).check("The diagnostic fee is $89.").triggers == []
    assert guard(cedar).check("The diagnostic fee is eighty-nine dollars.").triggers == []
    assert "price" in guard(cedar).check("A new compressor is $1,800.").triggers


def test_markdown_stripped(jolly: LoadedTenant) -> None:
    r = guard(jolly).check("**Sure!** See https://example.com")
    assert r.text == "Sure! See our website" and "markdown" in r.triggers


def test_word_budget(jolly: LoadedTenant) -> None:
    g = guard(jolly)
    sentence = " ".join(["word"] * 30) + "."
    assert g.check(sentence).text  # first sentence always allowed
    second = g.check(sentence)
    assert second.text == "" and "too_long" in second.triggers
