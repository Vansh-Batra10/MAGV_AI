# AI Receptionist: developer commands. Run `make help` for the list.
PY ?= python3.12
VENV ?= .venv
BIN := $(VENV)/bin
HOST ?= 127.0.0.1
PORT ?= 8000

.DEFAULT_GOAL := help
.PHONY: help setup run test lint fmt migrate validate-config check eval eval-core seed tunnel clean

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

$(BIN)/python:
	$(PY) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip

setup: $(BIN)/python ## Create venv, install deps, copy .env, migrate the local DB
	$(BIN)/pip install -e ".[dev]"
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")
	@mkdir -p var
	$(MAKE) migrate

run: ## Run the API with auto-reload
	$(BIN)/uvicorn receptionist.main:create_app --factory --reload --host $(HOST) --port $(PORT)

test: ## Run the test suite
	$(BIN)/pytest

lint: ## Lint and check formatting
	$(BIN)/ruff check src tests migrations
	$(BIN)/ruff format --check src tests migrations

fmt: ## Auto-fix lint issues and format
	$(BIN)/ruff check --fix src tests migrations
	$(BIN)/ruff format src tests migrations

migrate: ## Apply database migrations
	$(BIN)/alembic upgrade head

validate-config: ## Validate every tenant config (same check as startup)
	$(BIN)/python -m receptionist.config.validate

check: lint test validate-config ## Everything CI runs

eval-core: ## Minimal eval, 10 core personas (Phase 2)
	@echo "eval-core arrives in Phase 2." && exit 2

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
