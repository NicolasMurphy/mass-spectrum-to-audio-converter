#!/bin/bash
echo "Running pytest..."
docker compose exec -T app python -m pytest tests/ -v -s --cov=. --cov-report=term-missing

echo "Running Playwright tests..."
cd tests/e2e && npm run test
