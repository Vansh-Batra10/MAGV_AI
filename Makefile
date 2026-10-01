# AI Receptionist: developer commands. Run `make help` for the list.
PY ?= python3.12
VENV ?= .venv
BIN := $(VENV)/bin
HOST ?= 127.0.0.1
PORT ?= 8000

.DEFAULT_GOAL := help
.PHONY: help setup hooks run test lint fmt migrate validate-config secrets check eval eval-core seed tunnel clean

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

$(BIN)/python:
	$(PY) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip

setup: $(BIN)/python ## Create venv, install deps, copy .env, migrate the local DB
	$(BIN)/pip install -e ".[dev]"
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")
	@mkdir -p var
	$(MAKE) hooks
	$(MAKE) migrate

hooks: ## Install the git pre-commit hook (secret scan)
	git config core.hooksPath .githooks

run: ## Run the API with auto-reload
	$(BIN)/uvicorn receptionist.main:create_app --factory --reload --host $(HOST) --port $(PORT)

test: ## Run the test suite
	$(BIN)/pytest

lint: ## Lint and check formatting
	$(BIN)/ruff check src tests migrations scripts evals
	$(BIN)/ruff format --check src tests migrations scripts evals

fmt: ## Auto-fix lint issues and format
	$(BIN)/ruff check --fix src tests migrations scripts evals
	$(BIN)/ruff format src tests migrations scripts evals

migrate: ## Apply database migrations
	$(BIN)/alembic upgrade head

validate-config: ## Validate every tenant config (same check as startup)
	$(BIN)/python -m receptionist.config.validate

secrets: ## Scan every tracked file for API-key patterns
	$(BIN)/python scripts/check_secrets.py --all

check: secrets lint test validate-config ## Everything CI runs

eval-core: ## Minimal eval: 10 core personas vs the agent (needs ANTHROPIC_API_KEY)
	$(BIN)/python -m evals.runner --personas core --parallel 4 --threshold 0.8

eval: ## Full eval harness (Phase 4)
	@echo "eval arrives in Phase 4." && exit 2

seed: ## Seed demo conversations for the dashboard (Phase 6)
	@echo "seed arrives in Phase 6." && exit 2

tunnel: ## Expose the local server over HTTPS (cloudflared quick tunnel)
	@command -v cloudflared >/dev/null || (echo "Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" && exit 1)
	cloudflared tunnel --url http://$(HOST):$(PORT)

clean: ## Remove caches (keeps the venv and the database)
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
	rm -rf .pytest_cache .ruff_cache
