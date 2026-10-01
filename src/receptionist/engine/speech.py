"""Deterministic rendering of times, phone numbers and addresses for speech (DESIGN.md 7.3).

The LLM never formats dates, times or read-backs itself; tools return these strings.
"""

from __future__ import annotations

import re
from datetime import datetime

import phonenumbers

DIGITS = {
    "en": ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
    "es": ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"],
}
_ONES = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
_ORDINAL_SUFFIX = {1: "st", 2: "nd", 3: "rd"}
STREET_ABBREVIATIONS = {
    "st": "Street",
    "dr": "Drive",
    "ave": "Avenue",
    "ln": "Lane",
    "rd": "Road",
    "blvd": "Boulevard",
    "ct": "Court",
    "cir": "Circle",
    "pkwy": "Parkway",
    "trl": "Trail",
    "hwy": "Highway",
    "pl": "Place",
    "cv": "Cove",
    "apt": "apartment",
    "ste": "suite",
}
DIRECTIONS = {"n": "North", "s": "South", "e": "East", "w": "West"}


# --- phone numbers -----------------------------------------------------------------------


def normalize_phone(raw: str, region: str = "US") -> str | None:
    """E.164 for a valid number, else None."""
    try:
        parsed = phonenumbers.parse(raw, region)
    except phonenumbers.NumberParseException:
        return None
    if not phonenumbers.is_valid_number(parsed):
        return None
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def find_phone(text: str, region: str = "US") -> str | None:
    for match in phonenumbers.PhoneNumberMatcher(text, region):
        if phonenumbers.is_valid_number(match.number):
            return phonenumbers.format_number(match.number, phonenumbers.PhoneNumberFormat.E164)
    return None


def _digits(s: str, locale: str) -> str:
    return " ".join(DIGITS[locale][int(d)] for d in s)


def read_back_phone(e164: str, locale: str = "en") -> str:
    """'+15125550198' -> 'five one two, five five five, zero one nine eight'."""
    national = e164[2:] if e164.startswith("+1") and len(e164) == 12 else e164.lstrip("+")
    if len(national) == 10:
        groups = [national[:3], national[3:6], national[6:]]
    else:
        groups = [national]
    return ", ".join(_digits(g, locale) for g in groups)


def last_four(e164: str, locale: str = "en") -> str:
    return _digits(e164[-4:], locale)


# --- numbers and addresses -----------------------------------------------------------------


def number_words(n: int) -> str:
    if n < 20:
        return _ONES[n] or "zero"
    if n < 100:
        tens, ones = divmod(n, 10)
        return _TENS[tens] + (f"-{_ONES[ones]}" if ones else "")
    raise ValueError("only 0-99 supported")


def house_number_words(num: str) -> str:
    """How people say house numbers: 2104 -> twenty-one oh four; 512 -> five twelve."""
    if not num.isdigit():
        return num
    if len(num) <= 2:
        return number_words(int(num))
    if len(num) in (3, 4):
        head, tail = num[:-2], num[-2:]
        if tail == "00":
            return f"{number_words(int(head))} hundred"
        tail_words = f"oh {_ONES[int(tail)]}" if tail.startswith("0") else number_words(int(tail))
        return f"{number_words(int(head))} {tail_words}"
    return _digits(num, "en")


def read_back_address(line: str) -> str:
    words = line.replace(",", " ,").split()
    out = []
    for i, w in enumerate(words):
        bare = w.rstrip(".").lower()
        if i == 0 and w.isdigit():
            out.append(house_number_words(w))
        elif bare in DIRECTIONS and i + 1 < len(words) and i <= 1:
            out.append(DIRECTIONS[bare])
        elif bare in STREET_ABBREVIATIONS and i > 0:
            out.append(STREET_ABBREVIATIONS[bare])
        elif w.isdigit():
            out.append(house_number_words(w) if len(w) <= 4 else _digits(w, "en"))
        else:
            out.append(w)
    return re.sub(r"\s+,", ",", " ".join(out))


# --- dates and times -----------------------------------------------------------------------


def _ordinal(day: int) -> str:
    suffix = "th" if 11 <= day % 100 <= 13 else _ORDINAL_SUFFIX.get(day % 10, "th")
    return f"{day}{suffix}"


def spoken_clock(dt: datetime) -> str:
    hour = dt.hour % 12 or 12
    ampm = "AM" if dt.hour < 12 else "PM"
    return f"{hour} {ampm}" if dt.minute == 0 else f"{hour}:{dt.minute:02d} {ampm}"


def spoken_day(dt: datetime, now: datetime) -> str:
    """Relative day phrase in the tenant's timezone. Both datetimes must share a tz."""
    delta = (dt.date() - now.date()).days
    if delta == 0:
        return "today"
    if delta == 1:
        return "tomorrow"
    if 1 < delta <= 6:
        return dt.strftime("%A")
    return f"{dt.strftime('%A')}, {dt.strftime('%B')} {_ordinal(dt.day)}"


def spoken_slot(dt: datetime, now: datetime) -> str:
    """'Monday at 8 AM', 'tomorrow at 10:30 AM', 'Monday, October 12th at 8 AM'."""
    return f"{spoken_day(dt, now)} at {spoken_clock(dt)}"


def join_offers(slots: list[datetime], now: datetime) -> str:
    """Combine up to two slots naturally: 'Monday at 8 AM or 10 AM'."""
    if not slots:
        return ""
    if len(slots) == 1:
        return spoken_slot(slots[0], now)
    a, b = slots[0], slots[1]
    if a.date() == b.date():
        return f"{spoken_slot(a, now)} or {spoken_clock(b)}"
    return f"{spoken_slot(a, now)} or {spoken_slot(b, now)}"
