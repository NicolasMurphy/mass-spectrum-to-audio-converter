.PHONY: all lint format test playwright

all: lint test playwright

lint:
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
