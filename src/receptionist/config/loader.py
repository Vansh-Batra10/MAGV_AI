"""Load and validate every tenant config at startup. Invalid config means no boot."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Iterator, Mapping
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from receptionist.config.models import TenantConfig


class ConfigError(Exception):
    """One or more tenant configs are invalid. The message lists every problem with its path."""


@dataclass(frozen=True)
class LoadedTenant:
    config: TenantConfig
    path: Path
    config_hash: str
    raw: dict

    @property
    def client_id(self) -> str:
        return self.config.client_id


def _format_validation_error(path: Path, exc: ValidationError) -> list[str]:
    lines = []
    for err in exc.errors():
        loc = ".".join(str(p) for p in err["loc"]) or "<root>"
        lines.append(f"{path}: {loc}: {err['msg']}")
    return lines


def load_tenant_file(path: Path) -> LoadedTenant:
    try:
        text = path.read_text(encoding="utf-8")
        raw = json.loads(text)
    except (OSError, json.JSONDecodeError) as exc:
        raise ConfigError(f"{path}: cannot read JSON: {exc}") from exc
    try:
        cfg = TenantConfig.model_validate(raw)
    except ValidationError as exc:
        raise ConfigError("\n".join(_format_validation_error(path, exc))) from exc
    if path.stem != cfg.client_id:
        raise ConfigError(f"{path}: file name must be '{cfg.client_id}.json' (matches client_id)")
    canonical = json.dumps(raw, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    digest = hashlib.sha256(canonical.encode()).hexdigest()[:16]
    return LoadedTenant(config=cfg, path=path, config_hash=digest, raw=raw)


class TenantRegistry(Mapping[str, LoadedTenant]):
    """Immutable mapping of client_id -> LoadedTenant."""

    def __init__(self, tenants: dict[str, LoadedTenant]) -> None:
        self._tenants = dict(tenants)

    def __getitem__(self, client_id: str) -> LoadedTenant:
        return self._tenants[client_id]

    def __iter__(self) -> Iterator[str]:
        return iter(sorted(self._tenants))

    def __len__(self) -> int:
        return len(self._tenants)

    def all_todos(self) -> dict[str, list[str]]:
        return {cid: t.config.todos for cid, t in self._tenants.items() if t.config.todos}


def load_tenants(directory: Path) -> TenantRegistry:
    if not directory.is_dir():
        raise ConfigError(f"tenants directory {directory} does not exist")
    files = sorted(directory.glob("*.json"))
    if not files:
        raise ConfigError(f"no tenant configs found in {directory}")
    problems: list[str] = []
    tenants: dict[str, LoadedTenant] = {}
    for path in files:
        try:
            loaded = load_tenant_file(path)
        except ConfigError as exc:
            problems.append(str(exc))
            continue
        if loaded.client_id in tenants:
            problems.append(f"{path}: duplicate client_id {loaded.client_id!r}")
            continue
        tenants[loaded.client_id] = loaded
    if problems:
        raise ConfigError("Invalid tenant configuration:\n" + "\n".join(problems))
    return TenantRegistry(tenants)
