"""
Integration tests for AI Server endpoints
"""
import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock

from app.main import app


class TestAIEndpointsIntegration:
    """Integration tests for AI reasoning endpoints"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_managers(self):
        """Mock both managers for integration tests"""
        mock_model = MagicMock()
        mock_model.generate_text = AsyncMock(return_value={
            "result": "Integration test response",
            "model_used": "test-model"
        })
        mock_model.analyze_image = AsyncMock(return_value={
            "result": "Integration image analysis",
            "model_used": "vision-model"
        })
        mock_model.vision_model = None
        mock_model.initialize_vision_model = AsyncMock()
        
        mock_config = MagicMock()
        mock_config.get_config.return_value = {
            "llm": {
                "system_prompt": "You are a helpful {app_name} assistant. Query: {user_query}",
                "context_message": "Test context",
                "parameters": {"max_tokens": 300, "temperature": 0.1}
            }
        }
        
        return mock_model, mock_config
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        with patch('app.controllers.health_controller.model_manager') as mock_model:
            mock_model.get_status.return_value = {
                "text_model_loaded": True,
                "vision_model_loaded": False,
                "loaded_models": ["test-model"],
                "device": "cpu"
            }
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "version" in data
            assert "uptime_seconds" in data
            # Don't assert length since health check can gracefully handle no models
            assert "models_loaded" in data
    
    def test_server_info_endpoint(self, client):
        """Test server info endpoint"""
        with patch('app.controllers.health_controller.model_manager') as mock_model:
            with patch('app.controllers.health_controller.config_manager') as mock_config:
                mock_model.get_status.return_value = {
                    "text_model_loaded": True,
                    "vision_model_loaded": False
                }
                mock_config.list_available_apps.return_value = ["ecommerce", "general"]
                
                response = client.get("/server-info")
                
                assert response.status_code == 200
                data = response.json()
                assert data["server_status"] == "running"
                assert "model_info" in data
                assert "system_info" in data
                assert "endpoints" in data
    
    def test_generic_reasoning_endpoint(self, client, mock_managers):
        """Test generic reasoning endpoint"""
        mock_model, mock_config = mock_managers
        
        with patch('app.services.ai_service.model_manager', mock_model):
            request_data = {
                "instruction": "What is machine learning?",
                "context": "Educational context",
                "parameters": {"max_tokens": 100, "temperature": 0.7}
            }
            
            response = client.post("/reason", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["result"] == "Integration test response"
            assert data["model_used"] == "test-model"
            assert data["processing_time_ms"] > 0
    
    def test_app_specific_reasoning_endpoint(self, client, mock_managers):
        """Test app-specific reasoning endpoint"""
        mock_model, mock_config = mock_managers
        
        with patch('app.services.ai_service.model_manager', mock_model):
            with patch('app.services.ai_service.config_manager', mock_config):
                request_data = {
                    "app_name": "ecommerce",
                    "user_query": "Show me laptops",
                    "available_categories": ["electronics"],
                    "current_filters": {"brand": "Apple"}
                }
                
                response = client.post("/app-reason", json=request_data)
                
                assert response.status_code == 200
                data = response.json()
                assert data["raw_llm_response"] == "Integration test response"
                assert data["app_name"] == "ecommerce"
                assert data["processing_successful"] is True
    
    def test_image_reasoning_endpoint(self, client, mock_managers):
        """Test image reasoning endpoint"""
        mock_model, mock_config = mock_managers
        
        with patch('app.services.ai_service.model_manager', mock_model):
            request_data = {
                "instruction": "Describe this image",
                "image_data": "base64_encoded_image_data",
                "image_format": "jpeg",
                "parameters": {"max_tokens": 200}
            }
            
            response = client.post("/reason-image", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["result"] == "Integration image analysis"
            assert data["model_used"] == "vision-model"
            assert data["task_type"] == "image_reasoning"
    
    def test_config_list_endpoint(self, client):
        """Test configuration listing endpoint"""
        with patch('app.controllers.config_controller.config_manager') as mock_config:
            mock_config.get_app_list_with_info.return_value = [
                {"name": "ecommerce", "description": "E-commerce app"}
            ]
            mock_config.list_available_apps.return_value = ["ecommerce"]
            
            response = client.get("/apps")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["total_configurations"] == 1
            assert "ecommerce" in data["available_apps"]
    
    def test_config_get_endpoint(self, client):
        """Test specific configuration retrieval"""
        with patch('app.controllers.config_controller.config_manager') as mock_config:
            mock_config.config_exists.return_value = True
            mock_config.get_config.return_value = {
                "name": "ecommerce",
                "llm": {"system_prompt": "Test prompt"}
            }
            
            response = client.get("/apps/ecommerce/config")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["app_name"] == "ecommerce"
            assert data["configuration"]["name"] == "ecommerce"
    
    def test_config_reload_endpoint(self, client):
        """Test configuration reload endpoint"""
        with patch('app.controllers.config_controller.config_manager') as mock_config:
            mock_config.reload_config.return_value = True
            
            response = client.post("/apps/ecommerce/reload")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "reloaded"
            assert data["app_name"] == "ecommerce"
    
    def test_config_reload_all_endpoint(self, client):
        """Test reload all configurations endpoint"""
        with patch('app.controllers.config_controller.config_manager') as mock_config:
            mock_config.list_available_apps.return_value = ["ecommerce", "general"]
            
            response = client.post("/config/reload-all")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "reloaded"
            assert data["total_configurations"] == 2


class TestErrorHandlingIntegration:
    """Integration tests for error handling"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_generic_reasoning_validation_error(self, client):
        """Test generic reasoning with validation error"""
        # Missing required instruction field
        request_data = {
            "context": "Test context"
        }
        
        response = client.post("/reason", json=request_data)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_app_reasoning_validation_error(self, client):
        """Test app-specific reasoning with validation error"""
        # Missing required fields
        request_data = {
            "app_name": "ecommerce"
            # Missing user_query
        }
        
        response = client.post("/app-reason", json=request_data)
        
        assert response.status_code == 422
    
    def test_image_reasoning_validation_error(self, client):
        """Test image reasoning with validation error"""
        # Missing required fields
        request_data = {
            "instruction": "Analyze image"
            # Missing image_data
        }
        
        response = client.post("/reason-image", json=request_data)
        
        assert response.status_code == 422
    
    def test_config_not_found_error(self, client):
        """Test configuration not found error"""
        with patch('app.controllers.config_controller.config_manager') as mock_config:
            mock_config.config_exists.return_value = False
            
            response = client.get("/apps/nonexistent/config")
            
            assert response.status_code == 404
            data = response.json()
            assert "not found" in data["detail"]
    
    def test_service_error_handling(self, client):
        """Test service layer error handling"""
        with patch('app.services.ai_service.model_manager') as mock_model:
            mock_model.generate_text.side_effect = Exception("Service error")
            
            request_data = {
                "instruction": "Test instruction",
                "context": "Test context"
            }
            
            response = client.post("/reason", json=request_data)
            
            assert response.status_code == 500
            data = response.json()
            assert "error" in data


class TestCORSIntegration:
    """Integration tests for CORS configuration"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.options("/health")
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
    
    def test_preflight_request(self, client):
        """Test preflight OPTIONS request"""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
        
        response = client.options("/reason", headers=headers)
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
