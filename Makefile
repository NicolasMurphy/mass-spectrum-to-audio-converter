.PHONY: all lint format test playwright lint-api

all: lint test playwright

lint: lint-api
	ruff check .
	ruff format --check .
	cd frontend && npm run lint
	docker compose exec -T app pyright

format:
	ruff format .

test:
	docker compose exec -T app python -m pytest tests/ -v -s --cov=. --cov-report=term-missing

playwright:
	cd tests/playwright && npm run test

lint-api:
	npx --yes @stoplight/spectral-cli@6 lint frontend/public/openapi.yaml --ruleset .spectral.yaml
