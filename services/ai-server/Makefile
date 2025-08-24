# AI Server Makefile - Quick Commands

.PHONY: help dev start test test-unit test-integration test-coverage lint format clean setup health install

# Default target
help:
	@echo "AI Server Quick Commands"
	@echo "========================"
	@echo ""
	@echo "Development:"
	@echo "  dev              Start development server with hot reload"
	@echo "  start            Start production server"
	@echo "  setup            Setup development environment"
	@echo ""
	@echo "Testing:"
	@echo "  test             Run all tests"
	@echo "  test-unit        Run unit tests only"
	@echo "  test-integration Run integration tests only"
	@echo "  test-coverage    Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint             Run code linting"
	@echo "  format           Format code with black and isort"
	@echo "  quality          Run all quality checks"
	@echo ""
	@echo "Utilities:"
	@echo "  clean            Clean cache files and build artifacts"
	@echo "  health           Check if server is running and healthy"
	@echo "  install          Install dependencies"

# Development commands
dev:
	@echo "Starting development server..."
	python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

start:
	@echo "Starting production server..."
	python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

setup:
	@echo "Setting up development environment..."
	pip install -e .[dev]
	@echo "Development environment ready"

install:
	@echo "Installing dependencies..."
	pip install -e .

# Testing commands
test:
	@echo "Running all tests..."
	python -m pytest tests/ -v

test-unit:
	@echo "Running unit tests..."
	python -m pytest tests/unit/ -v

test-integration:
	@echo "Running integration tests..."
	python -m pytest tests/integration/ -v

test-coverage:
	@echo "Running tests with coverage..."
	python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing
	@echo "Coverage report generated in htmlcov/"

# Code quality commands
lint:
	@echo "Running code linting..."
	@python -m flake8 app tests --max-line-length=88 --extend-ignore=E203,W503 || echo "flake8 not installed"
	@python -m isort --check-only app tests || echo "isort not installed"

format:
	@echo "Formatting code..."
	@python -m black app tests || echo "black not installed"
	@python -m isort app tests || echo "isort not installed"

quality: format lint
	@echo "Code quality checks complete"

# Utility commands
clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type f -name "*.pyd" -delete 2>/dev/null || true
	rm -rf .pytest_cache .coverage htmlcov .mypy_cache *.egg-info build dist 2>/dev/null || true
	@echo "Cleanup complete"

health:
	@echo "Checking server health..."
	@python -c "import requests; r=requests.get('http://localhost:8000/health', timeout=5); print('Server is healthy' if r.status_code==200 else 'Server unhealthy'); print(f'Status: {r.json().get(\"status\", \"unknown\")}' if r.status_code==200 else '')" 2>/dev/null || echo "Server not reachable (make sure it's running with 'make dev')"

# Windows compatibility
clean-win:
	@echo "Cleaning up (Windows)..."
	@if exist "__pycache__" rmdir /s /q __pycache__ 2>nul || echo "No cache to clean"
	@if exist ".pytest_cache" rmdir /s /q .pytest_cache 2>nul || echo "No pytest cache to clean"
	@if exist "htmlcov" rmdir /s /q htmlcov 2>nul || echo "No coverage reports to clean"
	@if exist ".coverage" del .coverage 2>nul || echo "No coverage file to clean"
	@echo "Cleanup complete"
