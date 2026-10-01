"""Deterministic urgency floor from tenant rules (DESIGN.md section 3.8).

The LLM may classify urgency too, but never below what these rules say.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from receptionist.config.models import EmergencyRule, LocalizedText, TenantConfig, Urgency
from receptionist.engine.text import matches_any, normalize

LEVELS: dict[str, int] = {"routine": 0, "urgent": 1, "emergency": 2}


def max_urgency(*levels: Urgency | None) -> Urgency | None:
    present = [lvl for lvl in levels if lvl is not None]
    return max(present, key=LEVELS.__getitem__) if present else None


@dataclass(frozen=True)
class RuleMatch:
    rule_id: str
    label: str
    urgency: Urgency
    alert_on_call: bool
    safety_script: LocalizedText | None
    evidence: tuple[str, ...]


@dataclass(frozen=True)
class UrgencyAssessment:
    level: Urgency | None
    matches: tuple[RuleMatch, ...] = field(default_factory=tuple)
    in_season: dict[str, bool] = field(default_factory=dict)

    @property
    def alert_on_call(self) -> bool:
        return self.level == "emergency" and any(
            m.alert_on_call and m.urgency == "emergency" for m in self.matches
        )

    @property
    def safety_scripts(self) -> list[tuple[str, LocalizedText]]:
        return [(m.rule_id, m.safety_script) for m in self.matches if m.safety_script]


def _rule_level(rule: EmergencyRule, cfg: TenantConfig, local_date: date) -> Urgency:
    if rule.urgency is not None:
        return rule.urgency
    seasonal = rule.urgency_by_season
    assert seasonal is not None  # config validator guarantees exactly one
    in_season = cfg.seasons[seasonal.season].contains(local_date)
    return seasonal.in_season if in_season else seasonal.out_of_season


def _match(rule: EmergencyRule, text: str) -> tuple[str, ...] | None:
    evidence: list[str] = []
    if rule.match.any:
        hit = matches_any(rule.match.any, text)
        if hit:
            return (hit,)
    if rule.match.all_of:
        for group in rule.match.all_of:
            hit = matches_any(group, text)
            if hit is None:
                return None
            evidence.append(hit)
        return tuple(evidence)
    return None


def assess(cfg: TenantConfig, caller_text: str, local_date: date) -> UrgencyAssessment:
    """Evaluate every rule against the caller's accumulated text on `local_date` (tenant tz)."""
    text = normalize(caller_text)
    matches = []
    for rule in cfg.emergency_rules:
        evidence = _match(rule, text)
        if evidence is None:
            continue
        matches.append(
            RuleMatch(
                rule_id=rule.id,
                label=rule.label,
                urgency=_rule_level(rule, cfg, local_date),
                alert_on_call=rule.alert_on_call,
                safety_script=rule.safety_script,
                evidence=evidence,
            )
        )
    level = max_urgency(*(m.urgency for m in matches))
    seasons = {name: rng.contains(local_date) for name, rng in cfg.seasons.items()}
    return UrgencyAssessment(level=level, matches=tuple(matches), in_season=seasons)
