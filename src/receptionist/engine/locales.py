"""Caller-facing templates, loaded from locales/<lang>.yaml (the i18n seam, DESIGN.md 3.6)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


class Locale:
    def __init__(self, lang: str, data: dict[str, Any]) -> None:
        self.lang = lang
        self._data = data

    def _get(self, key: str) -> Any:
        node: Any = self._data
        for part in key.split("."):
            if not isinstance(node, dict) or part not in node:
                raise KeyError(f"missing locale key {self.lang}:{key}")
            node = node[part]
        return node

    def t(self, key: str, **fields: Any) -> str:
        value = self._get(key)
        if not isinstance(value, str):
            raise KeyError(f"locale key {self.lang}:{key} is not a string")
        return value.format(**fields)

    def choices(self, key: str) -> list[str]:
        value = self._get(key)
        return list(value) if isinstance(value, list) else [str(value)]


@lru_cache(maxsize=8)
def load_locale(directory: Path, lang: str) -> Locale:
    path = directory / f"{lang}.yaml"
    with path.open(encoding="utf-8") as fh:
        return Locale(lang, yaml.safe_load(fh) or {})
