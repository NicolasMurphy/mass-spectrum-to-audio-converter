.PHONY: all lint test playwright

all: lint test playwright

lint:
	ruff check .
	cd frontend && npm run lint
	docker compose exec -T app pyright

test:
	docker compose exec -T app python -m pytest tests/ -v -s --cov=. --cov-report=term-missing

playwright:
	cd tests/playwright && npm run test
