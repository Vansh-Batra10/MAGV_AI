"""Output guards applied to streamed LLM text before it is spoken (DESIGN.md 3.5)."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from receptionist.config.models import TenantConfig

_SENTENCE_END = re.compile(r"([.?!])(\s+|$)")
MAX_WORDS_PER_TURN = 45

BOOKED_CLAIM_RE = re.compile(
    r"\b(you'?re (all )?(set|booked|scheduled|confirmed)|you are (all )?(set|booked|scheduled)"
    r"|(i'?ve|i have|we'?ve|we have) (booked|scheduled|confirmed)|is (now )?(booked|confirmed)"
    r"|booked (you|it|that)|got you (down|booked|scheduled)|put you down for"
    r"|your appointment is (set|confirmed|booked)|confirmed for|you'?re on the schedule"
    r"|agendad[oa]|programad[oa]|confirmad[oa])\b",
    re.IGNORECASE,
)
_MONEY_RE = re.compile(
    r"\$\s?\d[\d,]*(?:\.\d{1,2})?|\b\d[\d,]*(?:\.\d{1,2})?\s*(?:dollars?|bucks)\b"
    r"|\b(?:[a-z]+[- ])*(?:hundred|thousand|[a-z]+ty(?:-[a-z]+)?|ten|eleven|twelve|[a-z]+teen)"
    r"\s+dollars?\b",
    re.IGNORECASE,
)
_MARKDOWN_RE = re.compile(r"(\*\*|__|`|#+\s|^\s*[-*•]\s+|^\s*\d+[.)]\s+)", re.MULTILINE)
_URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)


class SentenceChunker:
    """Buffer streamed text and release sentence-sized chunks."""

    def __init__(self, soft_limit_words: int = 12) -> None:
        self._buf = ""
        self._soft = soft_limit_words

    def feed(self, text: str) -> list[str]:
        self._buf += text
        out: list[str] = []
        while True:
            m = _SENTENCE_END.search(self._buf)
            if m:
                out.append(self._buf[: m.end(1)].strip())
                self._buf = self._buf[m.end() :]
                continue
            comma = self._buf.rfind(", ")
            if comma > 0 and len(self._buf[:comma].split()) >= self._soft:
                out.append(self._buf[: comma + 1].strip())
                self._buf = self._buf[comma + 2 :]
                continue
            break
        return [c for c in out if c]

    def flush(self) -> list[str]:
        rest, self._buf = self._buf.strip(), ""
        return [rest] if rest else []


@dataclass
class GuardResult:
    text: str  # "" means drop the chunk
    triggers: list[str] = field(default_factory=list)


@dataclass
class OutputGuard:
    """Stateful per turn: tracks the word budget."""

    cfg: TenantConfig
    booking_confirmed: bool
    blocked_line: str
    words_spoken: int = 0
    budget_exhausted: bool = False

    def _price_allowed(self, amount_text: str) -> bool:
        allowed = self.cfg.pricing_policy.quotable_amounts
        norm = amount_text.lower().replace("$", "").replace(",", "").strip()
        for a in allowed:
            amount = f"{a.amount_usd:g}"
            if norm.startswith(amount) or a.spoken.lower() in amount_text.lower():
                return True
        return False

    def check(self, chunk: str) -> GuardResult:
        triggers: list[str] = []
        text = _URL_RE.sub("our website", chunk)
        cleaned = _MARKDOWN_RE.sub("", text)
        if cleaned != text:
            triggers.append("markdown")
        text = cleaned.replace("&", " and ").strip()

        if not self.booking_confirmed and BOOKED_CLAIM_RE.search(text):
            return GuardResult(self.blocked_line, [*triggers, "booked_claim"])

        for m in _MONEY_RE.finditer(text):
            if not self._price_allowed(m.group()):
                return GuardResult(self.cfg.pricing_policy.deflection_line, [*triggers, "price"])

        words = len(text.split())
        over_budget = self.budget_exhausted or self.words_spoken + words > MAX_WORDS_PER_TURN
        if over_budget and self.words_spoken > 0:  # the first sentence is always allowed
            self.budget_exhausted = True
            return GuardResult("", [*triggers, "too_long"])
        self.words_spoken += words
        return GuardResult(text, triggers)
