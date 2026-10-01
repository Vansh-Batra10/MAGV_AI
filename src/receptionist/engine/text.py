"""Text normalization shared by the deterministic matchers."""

from __future__ import annotations

import re
from functools import lru_cache

_AC_RE = re.compile(
    r"\b(?:air[\s-]?condition(?:er|ers|ing)|a\s?/\s?c|a\.\s?c\.?|aircon)(?!\w)", re.IGNORECASE
)
_WS_RE = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Lowercase, straighten quotes, unify spellings of "AC", collapse whitespace."""
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    text = _AC_RE.sub("ac", text)
    return _WS_RE.sub(" ", text).strip().lower()


@lru_cache(maxsize=4096)
def compile_pattern(pattern: str) -> re.Pattern[str]:
    """A config pattern: "re:<regex>" or a phrase matched on word boundaries."""
    if pattern.startswith("re:"):
        return re.compile(pattern[3:], re.IGNORECASE)
    phrase = re.escape(normalize(pattern)).replace(r"\ ", r"\s+")
    return re.compile(rf"(?<!\w){phrase}(?!\w)", re.IGNORECASE)


def matches_any(patterns: list[str], normalized_text: str) -> str | None:
    """Return the first pattern that matches, or None."""
    for p in patterns:
        if compile_pattern(p).search(normalized_text):
            return p
    return None
