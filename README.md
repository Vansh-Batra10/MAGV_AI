# AI Receptionist (spec demo for Jolly Brothers Services)

An AI receptionist for US home-services businesses. The design is in [DESIGN.md](DESIGN.md).
This is a **spec demo**: bookings go to the demo owner's Cal.com calendar, not Jolly Brothers'.

Status: **Phase 1 (skeleton)**. Config, database, logging, clock and health check are in place. The conversation engine arrives in Phase 2. The full 10-minute quickstart arrives in Phase 7.

## Quickstart (Phase 1)

Requires Python 3.12.

```bash
make setup            # venv, deps, .env from .env.example, migrate SQLite
make test             # unit + integration tests
make run              # http://127.0.0.1:8000/healthz
make validate-config  # validate tenants/*.json and list open TODOs
```

### Demo clock
To show weekend or after-hours behavior at any real time of day:

```bash
APP_ENV=demo DEMO_NOW=2026-10-03T14:10 make run   # Saturday 2:10 PM in each tenant's timezone
```

`DEMO_NOW` is refused unless `APP_ENV=demo`: the server will not start. `DEMO_CLOCK_MODE=frozen` stops the clock from ticking.

## Layout

```text
src/receptionist/   app code (settings, clock, config, db, logging, api)
tenants/            per-tenant JSON configs (validated at startup)
migrations/         Alembic migrations
tests/              unit + integration tests
```

Run `make help` for all commands.
