"""
Test fixtures and utilities for AI server testing
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app
from app.models import model_manager
from app.core.config_manager import config_manager


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_client():
    """Create a test client for FastAPI app"""
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def async_client():
    """Create an async test client for FastAPI app"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_model_manager():
    """Mock model manager for testing without loading actual models"""
    mock_manager = MagicMock()
    mock_manager.get_status.return_value = {
        "device": "cpu",
        "models_directory": "models",
        "available_models": 1,
        "loaded_models": ["text:mock_model"],
        "text_model_ready": True,
        "vision_model_ready": False,
        "memory_allocated": None
    }
    
    # Mock async methods
    mock_manager.generate_text = AsyncMock(return_value={
        "result": "Mock AI response for testing",
        "model_used": "text:mock_model"
    })
    
    mock_manager.analyze_image = AsyncMock(return_value={
        "result": "Mock image analysis result",
        "model_used": "vision:mock_model"
    })
    
    return mock_manager


@pytest.fixture
def mock_config_manager():
    """Mock config manager with test configurations"""
    mock_manager = MagicMock()
    
    # Mock test app configuration
    test_config = {
        "app": {
            "name": "test_app",
            "version": "1.0.0",
            "description": "Test application"
        },
        "llm": {
            "system_prompt": "Test prompt: {user_query}",
            "context_message": "Test context",
            "parameters": {
                "max_tokens": 100,
                "temperature": 0.1
            }
        }
    }
    
    mock_manager.get_config.return_value = test_config
    mock_manager.config_exists.return_value = True
    mock_manager.list_available_apps.return_value = ["test_app", "nextshop"]
    mock_manager.get_app_list_with_info.return_value = {
        "test_app": {
            "name": "test_app",
            "version": "1.0.0", 
            "description": "Test application"
        }
    }
    
    return mock_manager


@pytest.fixture
def sample_reasoning_request():
    """Sample reasoning request for testing"""
    return {
        "instruction": "What is 2+2?",
        "context": "Math problem",
        "parameters": {"max_tokens": 50, "temperature": 0.1},
        "task_type": "reasoning"
    }


@pytest.fixture
def sample_app_request():
    """Sample app-specific request for testing"""
    return {
        "app_name": "test_app",
        "user_query": "Show me products",
        "available_categories": ["electronics", "clothing"],
        "conversation_history": [],
        "mcp_tools_context": [],
        "ui_handlers_context": [],
        "current_filters": {},
        "user_session": {"user_id": "test_user"}
    }


@pytest.fixture
def sample_image_request():
    """Sample image reasoning request for testing"""
    # Simple base64 encoded 1x1 pixel image
    test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    return {
        "instruction": "What do you see in this image?",
        "image_data": test_image_b64,
        "image_format": "png",
        "context": "Test image analysis",
        "parameters": {"max_tokens": 100}
    }
