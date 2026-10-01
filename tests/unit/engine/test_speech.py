from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from receptionist.engine.speech import (
    find_phone,
    house_number_words,
    join_offers,
    normalize_phone,
    read_back_address,
    read_back_phone,
    spoken_slot,
)

CHI = ZoneInfo("America/Chicago")
NOW = datetime(2026, 10, 3, 14, 10, tzinfo=CHI)  # Saturday


@pytest.mark.parametrize(
    ("raw", "e164"),
    [
        ("(512) 555-0198", "+15125550198"),
        ("512.555.0198", "+15125550198"),
        ("+1 512 555 0198", "+15125550198"),
        ("555-0198", None),
        ("hello", None),
    ],
)
def test_normalize_phone(raw: str, e164: str | None) -> None:
    assert normalize_phone(raw) == e164


def test_find_phone_in_text() -> None:
    assert find_phone("sure, it's 512 555 0198 thanks") == "+15125550198"
    assert find_phone("no number") is None


def test_read_back_phone_en_es() -> None:
    assert read_back_phone("+15125550198") == "five one two, five five five, zero one nine eight"
    assert read_back_phone("+15125550198", "es").endswith("cero uno nueve ocho")


@pytest.mark.parametrize(
    ("num", "words"),
    [
        ("2104", "twenty-one oh four"),
        ("512", "five twelve"),
        ("1800", "eighteen hundred"),
        ("12", "twelve"),
        ("7", "seven"),
        ("10500", "one zero five zero zero"),
    ],
)
def test_house_numbers(num: str, words: str) -> None:
    assert house_number_words(num) == words


def test_read_back_address() -> None:
    assert read_back_address("2104 N Oak St") == "twenty-one oh four North Oak Street"
    assert read_back_address("512 Main Dr, Apt 3") == "five twelve Main Drive, apartment three"


@pytest.mark.parametrize(
    ("dt", "spoken"),
    [
        (datetime(2026, 10, 3, 16, 0, tzinfo=CHI), "today at 4 PM"),
        (datetime(2026, 10, 4, 10, 30, tzinfo=CHI), "tomorrow at 10:30 AM"),
        (datetime(2026, 10, 5, 8, 0, tzinfo=CHI), "Monday at 8 AM"),
        (datetime(2026, 10, 12, 12, 0, tzinfo=CHI), "Monday, October 12th at 12 PM"),
    ],
)
def test_spoken_slot(dt: datetime, spoken: str) -> None:
    assert spoken_slot(dt, NOW) == spoken


def test_join_offers() -> None:
    mon8 = datetime(2026, 10, 5, 8, 0, tzinfo=CHI)
    mon10 = datetime(2026, 10, 5, 10, 0, tzinfo=CHI)
    tue8 = datetime(2026, 10, 6, 8, 0, tzinfo=CHI)
    assert join_offers([mon8, mon10], NOW) == "Monday at 8 AM or 10 AM"
    assert join_offers([mon8, tue8], NOW) == "Monday at 8 AM or Tuesday at 8 AM"


def test_spoken_slot_across_dst() -> None:
    """Friday Oct 30 (CDT) offering Monday Nov 2 (CST): wall-clock 8 AM either way."""
    now = datetime(2026, 10, 30, 18, 0, tzinfo=CHI)
    slot = datetime(2026, 11, 2, 14, 0, tzinfo=ZoneInfo("UTC")).astimezone(CHI)
    assert spoken_slot(slot, now) == "Monday at 8 AM"
