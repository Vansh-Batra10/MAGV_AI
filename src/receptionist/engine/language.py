"""Deterministic Spanish detection (DESIGN.md section 3.6).

Tuned for short utterances, where statistical detectors are unreliable. Common Texas English
borrowings ("gracias", "si") alone never flip the language.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

STRONG_PHRASES = (
    "hablo español",
    "habla español",
    "en español",
    "no hablo inglés",
    "no hablo ingles",
    "aire acondicionado",
    "no funciona",
    "por favor",
    "buenos días",
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "necesito",
    "tengo un problema",
    "mi casa",
    "se descompuso",
    "no enfría",
    "no enfria",
    "olor a gas",
    "huele a gas",
    "quiero una cita",
)
FUNCTION_WORDS = frozenset(
    "el la los las un una unos unas de del en con para por que y o pero muy mi mis su sus es "
    "está esta estoy son tengo tiene hay hace no sí si yo usted ustedes nosotros me se lo le "
    "como cuando donde porque también ahora hoy mañana casa calor frío frio ayuda puede "
    "necesito quiero gracias hola bueno señor señora técnico tecnico".split()
)
ENGLISH_ONLY_BORROWINGS = frozenset({"gracias", "si", "hola", "bueno", "señor", "señora"})
ENGLISH_STOPWORDS = frozenset(
    "the a an is are was my our your it this that and or but to of in on for with have has "
    "not no i we you he she they can could would will just please hi hello thanks".split()
)
_WORD_RE = re.compile(r"[a-záéíóúüñ']+", re.IGNORECASE)


@dataclass(frozen=True)
class LanguageGuess:
    language: str  # "en" | "es"
    score: float
    reason: str


def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def detect(utterance: str) -> LanguageGuess:
    text = utterance.lower().strip()
    if not text:
        return LanguageGuess("en", 0.0, "empty")
    if re.search(r"\b(english|inglés please|in english)\b", text):
        return LanguageGuess("en", 0.0, "english requested")
    for phrase in STRONG_PHRASES:
        if phrase in text or _strip_accents(phrase) in _strip_accents(text):
            return LanguageGuess("es", 1.0, f"phrase:{phrase}")

    words = _WORD_RE.findall(text)
    if not words:
        return LanguageGuess("en", 0.0, "no words")
    es_hits = [w for w in words if w in FUNCTION_WORDS or _strip_accents(w) in FUNCTION_WORDS]
    en_hits = [w for w in words if w in ENGLISH_STOPWORDS]
    accent_bonus = 0.15 if re.search(r"[ñáéíóú¿¡]", text) else 0.0
    if es_hits and all(w in ENGLISH_ONLY_BORROWINGS for w in es_hits) and en_hits:
        return LanguageGuess("en", 0.0, "borrowings only")
    score = (len(es_hits) - len(en_hits)) / len(words) + accent_bonus
    if len(words) >= 3 and score >= 0.4:
        return LanguageGuess("es", round(score, 2), "function words")
    return LanguageGuess("en", round(max(score, 0.0), 2), "below threshold")
