"""`python -m receptionist.config.validate`: validate tenant configs and print a summary."""

from __future__ import annotations

import sys

from receptionist.config.loader import ConfigError, load_tenants
from receptionist.settings import get_settings


def main() -> int:
    settings = get_settings()
    try:
        registry = load_tenants(settings.tenants_dir)
    except ConfigError as exc:
        print(exc, file=sys.stderr)
        return 1
    for client_id, loaded in registry.items():
        todos = loaded.config.todos
        print(f"OK  {client_id}  ({loaded.path}, hash {loaded.config_hash}, {len(todos)} todos)")
        for todo in todos:
            print(f"    TODO: {todo}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
