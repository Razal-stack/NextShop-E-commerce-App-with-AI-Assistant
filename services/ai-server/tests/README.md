# AI Server Testing Framework

## Overview
This directory contains a comprehensive testing framework for the AI Server using pytest with async support, mocking, and coverage reporting.

## Test Structure

### Unit Tests (`tests/unit/`)
- **test_ai_controller.py** - Tests for AI controller layer with timeout handling and validation
- **test_ai_service.py** - Tests for AI service layer with different reasoning types
- **test_config_controller.py** - Tests for configuration management controllers
- **test_health_controller.py** - Tests for health check and server info endpoints

### Integration Tests (`tests/integration/`)
- **test_endpoints.py** - End-to-end API endpoint testing with FastAPI test client

### Test Configuration
- **conftest.py** - Shared fixtures and test utilities
- **pyproject.toml** - Pytest configuration with coverage settings

## Key Testing Features

### 1. Async Testing Support
- Uses pytest-asyncio for testing async controllers and services
- Proper event loop handling for async operations

### 2. Comprehensive Mocking
- Mock model manager for AI operations without loading actual models
- Mock config manager with test configurations
- Sample request fixtures for consistent testing

### 3. Error Handling Testing
- Validation error scenarios
- Service layer exceptions
- HTTP error responses
- Timeout handling

### 4. Integration Testing
- Full API endpoint testing with TestClient
- CORS configuration testing
- Request/response validation
- Error response formatting

## Running Tests

### All Tests
```bash
python -m pytest tests/ -v
```

### Unit Tests Only
```bash
python -m pytest tests/unit/ -v
```

### Integration Tests Only
```bash
python -m pytest tests/integration/ -v
```

### With Coverage
```bash
python -m pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
```

### Using Test Runner
```bash
python run_tests.py all      # All tests with coverage
python run_tests.py unit     # Unit tests only  
python run_tests.py integration # Integration tests only
```

## Test Coverage Areas

### Controllers
✅ AI reasoning endpoints (generic, app-specific, image)
✅ Health check and server info endpoints  
✅ Configuration management endpoints
✅ Error handling and validation
✅ Timeout protection

### Services  
✅ AI reasoning logic with different request types
✅ Input validation and sanitization
✅ Template formatting and error handling
✅ Model interaction mocking

### Integration
✅ Complete API workflows
✅ Request/response validation
✅ CORS configuration
✅ Error response formatting

## Mock Data and Fixtures

### Sample Requests
- Reasoning requests with various parameters
- App-specific requests with context data
- Image analysis requests with base64 data

### Mock Managers
- Model manager with text and vision model support
- Config manager with test app configurations
- Async operation mocking for realistic testing

## Dependencies
- pytest: Main testing framework
- pytest-asyncio: Async test support
- pytest-mock: Enhanced mocking capabilities
- pytest-cov: Coverage reporting
- FastAPI TestClient: API testing
- httpx: Async HTTP client for testing

## Best Practices Applied
- Comprehensive fixture usage for DRY principle
- Proper async/await pattern testing
- Isolation between tests with mocking
- Clear test naming and documentation
- Error scenario coverage
- Performance consideration testing (timeouts)
