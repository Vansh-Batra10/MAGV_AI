# AI Receptionist (spec demo for Jolly Brothers Services)

An AI receptionist for US home-services businesses. The design is in [DESIGN.md](DESIGN.md).
This is a **spec demo**: bookings go to the demo owner's Cal.com calendar, not Jolly Brothers'.

Status: **Phase 2 (engine + text channel)**. The conversation engine, text channel, debug web chat and a 10-persona mini eval run against a fake calendar. Cal.com arrives in Phase 3, voice in Phase 5. The full 10-minute quickstart arrives in Phase 7.

## Quickstart (Phase 2)

Requires Python 3.12.

```bash
make setup            # venv, deps, .env from .env.example, git hooks, migrate SQLite
# put ANTHROPIC_API_KEY=... in .env
APP_ENV=demo DEMO_NOW=2026-10-03T14:10 make run
# open http://127.0.0.1:8000/chat/jolly-brothers-round-rock
make test             # unit + integration + engine tests (no network)
make eval-core        # 10 core personas vs the live agent; report in evals/reports/
make validate-config  # validate tenants/*.json and list open TODOs
```

The web chat shows the tool-call timeline, state machine and per-turn latency/cost next to the
conversation. Without `ANTHROPIC_API_KEY` the agent can only capture a callback.

API: `POST /v1/chat/{client_id}` with `{"message": "..."}` starts a session (the reply includes
the greeting and the `session_id`). Send `{"session_id": "...", "message": "..."}` for later turns.

### Demo clock
To show weekend or after-hours behavior at any real time of day:

```bash
APP_ENV=demo DEMO_NOW=2026-10-03T14:10 make run   # Saturday 2:10 PM in each tenant's timezone
```

`DEMO_NOW` is refused unless `APP_ENV=demo`: the server will not start. `DEMO_CLOCK_MODE=frozen` stops the clock from ticking.

## Layout

```text
src/receptionist/   app code: engine/, tools/, adapters/, booking/, channels/, web/, config/, db/
tenants/            per-tenant JSON configs (validated at startup)
locales/            caller-facing templates (en, es)
evals/              personas, caller simulator, checks, report
migrations/         Alembic migrations
tests/              unit + integration tests
```

Run `make help` for all commands.

## Secrets

`.env` is gitignored. `make setup` installs a pre-commit hook (`scripts/check_secrets.py`) that
blocks commits containing API-key patterns or `.env` files; CI runs the same scan.
