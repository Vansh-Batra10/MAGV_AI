"""Two-tier coverage (DESIGN.md 3.7, rev 3 change 1)."""

import pytest

from receptionist.config.loader import LoadedTenant
from receptionist.engine.coverage import classify, extract_zip


@pytest.mark.parametrize(("city", "zip_code"), [("Round Rock", None), ("round rock, tx", "78664")])
def test_confirmed_city_is_covered(jolly: LoadedTenant, city: str, zip_code: str | None) -> None:
    assert classify(jolly.config, city=city, zip_code=zip_code).tier == "covered"


@pytest.mark.parametrize(
    "city", ["Georgetown", "Hutto", "Pflugerville", "Cedar Park", "Leander", "Austin"]
)
def test_candidates_are_unconfirmed_not_covered(jolly: LoadedTenant, city: str) -> None:
    result = classify(jolly.config, city=city, zip_code=None)
    assert result.tier == "unconfirmed"
    assert result.is_candidate


def test_unverified_zip_alone_is_unconfirmed(jolly: LoadedTenant) -> None:
    result = classify(jolly.config, city=None, zip_code="78664")
    assert result.tier == "unconfirmed" and result.is_candidate


def test_unknown_area_is_unconfirmed_not_declined(jolly: LoadedTenant) -> None:
    result = classify(jolly.config, city="San Antonio", zip_code="78205")
    assert result.tier == "unconfirmed" and not result.is_candidate


def test_nothing_given_is_unknown(jolly: LoadedTenant) -> None:
    assert classify(jolly.config, city=None, zip_code=None).tier == "unknown"


def test_only_excluded_areas_are_declined(cedar: LoadedTenant) -> None:
    assert classify(cedar.config, city="Boulder", zip_code=None).tier == "excluded"
    assert classify(cedar.config, city="Golden", zip_code=None).tier == "unconfirmed"
    assert classify(cedar.config, city="Denver", zip_code=None).tier == "covered"


def test_excluded_beats_covered(cedar: LoadedTenant) -> None:
    sa = cedar.config.service_area
    excl = sa.excluded_areas.model_copy(update={"cities": ["Denver"]})
    cfg = cedar.config.model_copy(
        update={"service_area": sa.model_copy(update={"excluded_areas": excl})}
    )
    assert classify(cfg, city="Denver", zip_code=None).tier == "excluded"


def test_extract_zip() -> None:
    assert extract_zip("2104 Oak St, Round Rock, TX 78664-1234") == "78664"
    assert extract_zip(None, "no zip here") is None
