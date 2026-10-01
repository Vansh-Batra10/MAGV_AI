"""Service-area coverage tiers (DESIGN.md section 3.7)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from receptionist.config.models import AreaList, TenantConfig

Tier = Literal["unknown", "covered", "unconfirmed", "excluded"]
_ZIP_RE = re.compile(r"\b(\d{5})(?:-\d{4})?\b")


def _norm_city(city: str) -> str:
    city = city.lower().replace(".", " ")
    city = re.sub(r",?\s+(tx|texas|co|colorado)$", "", city.strip())
    return re.sub(r"\s+", " ", city).strip()


def extract_zip(*texts: str | None) -> str | None:
    for t in texts:
        if t:
            m = _ZIP_RE.search(t)
            if m:
                return m.group(1)
    return None


@dataclass(frozen=True)
class Coverage:
    tier: Tier
    matched_on: str | None = None  # "city:round rock" / "zip:78664"
    is_candidate: bool = False  # listed in unverified_candidates (informational)


def _hit(cities: list[str], zips: list[str], city: str | None, zip_code: str | None) -> str | None:
    if zip_code and zip_code in zips:
        return f"zip:{zip_code}"
    if city and _norm_city(city) in {_norm_city(c) for c in cities}:
        return f"city:{_norm_city(city)}"
    return None


def _area_hit(area: AreaList, city: str | None, zip_code: str | None) -> str | None:
    return _hit(area.cities, area.zip_codes, city, zip_code)


def classify(cfg: TenantConfig, *, city: str | None, zip_code: str | None) -> Coverage:
    if not city and not zip_code:
        return Coverage("unknown")
    sa = cfg.service_area
    hit = _area_hit(sa.excluded_areas, city, zip_code)
    if hit:
        return Coverage("excluded", hit)
    hit = _hit(sa.cities, sa.zip_codes, city, zip_code)
    if hit:
        return Coverage("covered", hit)
    candidate = _area_hit(sa.unverified_candidates, city, zip_code)
    return Coverage("unconfirmed", candidate, is_candidate=candidate is not None)
