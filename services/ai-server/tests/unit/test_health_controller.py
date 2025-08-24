"""
Unit tests for Health Controller
"""
import pytest
from unittest.mock import patch, MagicMock

from app.controllers.health_controller import HealthController


class TestHealthController:
    """Test cases for Health Controller"""
    
    @pytest.mark.asyncio
    async def test_get_health_success(self, mock_model_manager):
        """Test successful health check"""
        with patch('app.controllers.health_controller.model_manager', mock_model_manager):
            response = await HealthController.get_health()
            
            assert response.status == "healthy"
            assert response.version == "1.0.0"
            assert len(response.models_loaded) > 0
            assert response.uptime_seconds >= 0
    
    @pytest.mark.asyncio
    async def test_get_health_with_memory_info(self, mock_model_manager):
        """Test health check with memory information"""
        # Mock psutil
        mock_process = MagicMock()
        mock_memory_info = MagicMock()
        mock_memory_info.rss = 100 * 1024 * 1024  # 100MB
        mock_memory_info.vms = 200 * 1024 * 1024  # 200MB
        mock_process.memory_info.return_value = mock_memory_info
        mock_process.cpu_percent.return_value = 5.5
        
        with patch('app.controllers.health_controller.model_manager', mock_model_manager):
            with patch('psutil.Process', return_value=mock_process):
                response = await HealthController.get_health()
                
                assert response.status == "healthy"
                assert response.memory_usage is not None
                assert response.memory_usage["rss_mb"] == 100.0
                assert response.memory_usage["vms_mb"] == 200.0
                assert response.memory_usage["cpu_percent"] == 5.5
    
    @pytest.mark.asyncio
    async def test_get_health_model_error(self):
        """Test health check when model status fails"""
        mock_manager = MagicMock()
        mock_manager.get_status.side_effect = Exception("Model error")
        
        with patch('app.controllers.health_controller.model_manager', mock_manager):
            response = await HealthController.get_health()
            
            assert response.status == "healthy"  # Still healthy even if model check fails
            assert "status-check-failed" in response.models_loaded
    
    @pytest.mark.asyncio
    async def test_get_health_general_error(self):
        """Test health check with model status error (gracefully handled)"""
        with patch('app.controllers.health_controller.model_manager') as mock_manager:
            mock_manager.get_status.side_effect = Exception("Critical error")
            
            response = await HealthController.get_health()
            
            # Model errors are handled gracefully, so status is still healthy
            assert response.status == "healthy"
            # But models_loaded will show the error occurred
            assert "status-check-failed" in response.models_loaded
    
    @pytest.mark.asyncio
    async def test_get_server_info_success(self, mock_model_manager, mock_config_manager):
        """Test successful server info retrieval"""
        with patch('app.controllers.health_controller.model_manager', mock_model_manager):
            with patch('app.controllers.health_controller.config_manager', mock_config_manager):
                response = await HealthController.get_server_info()
                
                assert response["server_status"] == "running"
                assert "model_info" in response
                assert "system_info" in response
                assert "endpoints" in response
                
                model_info = response["model_info"]
                assert model_info["text_model_loaded"] is True
                assert model_info["vision_model_loaded"] is False
                
                system_info = response["system_info"]
                assert "available_configs" in system_info
                assert "total_configs" in system_info
    
    @pytest.mark.asyncio
    async def test_get_server_info_error(self):
        """Test server info with error"""
        with patch('app.controllers.health_controller.model_manager') as mock_manager:
            mock_manager.get_status.side_effect = Exception("Server info error")
            
            response = await HealthController.get_server_info()
            
            assert response["server_status"] == "error"
            assert "error" in response
            assert response["error"] == "Server info error"
