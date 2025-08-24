"""
Unit tests for Config Controller
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from app.controllers.config_controller import ConfigController


class TestConfigController:
    """Test cases for Config Controller"""
    
    @pytest.mark.asyncio
    async def test_list_configurations_success(self, mock_config_manager):
        """Test successful configuration listing"""
        # Mock config manager methods
        mock_config_manager.get_app_list_with_info.return_value = [
            {"name": "ecommerce", "description": "E-commerce app"},
            {"name": "general", "description": "General purpose app"}
        ]
        mock_config_manager.list_available_apps.return_value = ["ecommerce", "general"]
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            response = await ConfigController.list_configurations()
            
            assert response["status"] == "success"
            assert response["total_configurations"] == 2
            assert "ecommerce" in response["available_apps"]
            assert "general" in response["available_apps"]
            assert len(response["configurations"]) == 2
    
    @pytest.mark.asyncio
    async def test_get_configuration_success(self, mock_config_manager):
        """Test successful specific configuration retrieval"""
        mock_config_manager.config_exists.return_value = True
        mock_config_manager.get_config.return_value = {
            "name": "ecommerce",
            "system_message": "You are an e-commerce assistant",
            "max_tokens": 100
        }
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            response = await ConfigController.get_configuration("ecommerce")
            
            assert response["status"] == "success"
            assert response["app_name"] == "ecommerce"
            assert response["configuration"]["name"] == "ecommerce"
            assert "system_message" in response["configuration"]
    
    @pytest.mark.asyncio
    async def test_get_configuration_not_found(self, mock_config_manager):
        """Test getting non-existent configuration"""
        mock_config_manager.config_exists.return_value = False
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            with pytest.raises(HTTPException) as exc_info:
                await ConfigController.get_configuration("nonexistent")
            
            assert exc_info.value.status_code == 404
            assert "not found" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_reload_configuration_success(self, mock_config_manager):
        """Test successful configuration reload"""
        mock_config_manager.reload_config.return_value = True
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            response = await ConfigController.reload_configuration("ecommerce")
            
            assert response["status"] == "reloaded"
            assert response["app_name"] == "ecommerce"
            assert "reloaded successfully" in response["message"]
    
    @pytest.mark.asyncio
    async def test_reload_configuration_not_found(self, mock_config_manager):
        """Test reloading non-existent configuration"""
        mock_config_manager.reload_config.return_value = False
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            with pytest.raises(HTTPException) as exc_info:
                await ConfigController.reload_configuration("nonexistent")
            
            assert exc_info.value.status_code == 404
            assert "not found" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_reload_all_configurations_success(self, mock_config_manager):
        """Test successful all configurations reload"""
        mock_config_manager.list_available_apps.return_value = ["ecommerce", "general"]
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            response = await ConfigController.reload_all_configurations()
            
            assert response["status"] == "reloaded"
            assert response["total_configurations"] == 2
            assert "ecommerce" in response["available_apps"]
            assert "general" in response["available_apps"]
            assert "All configurations reloaded" in response["message"]
    
    @pytest.mark.asyncio
    async def test_list_configurations_error(self):
        """Test list configurations with error"""
        mock_manager = MagicMock()
        mock_manager.get_app_list_with_info.side_effect = Exception("Config list error")
        
        with patch('app.controllers.config_controller.config_manager', mock_manager):
            with pytest.raises(HTTPException) as exc_info:
                await ConfigController.list_configurations()
            
            assert exc_info.value.status_code == 500
            assert "Failed to list configurations" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_configuration_error(self, mock_config_manager):
        """Test get configuration with error"""
        mock_config_manager.config_exists.return_value = True
        mock_config_manager.get_config.side_effect = Exception("Config retrieval error")
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            with pytest.raises(HTTPException) as exc_info:
                await ConfigController.get_configuration("ecommerce")
            
            assert exc_info.value.status_code == 500
            assert "Failed to get configuration" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_reload_configuration_error(self, mock_config_manager):
        """Test reload configuration with error"""
        mock_config_manager.reload_config.side_effect = Exception("Reload error")
        
        with patch('app.controllers.config_controller.config_manager', mock_config_manager):
            with pytest.raises(HTTPException) as exc_info:
                await ConfigController.reload_configuration("ecommerce")
            
            assert exc_info.value.status_code == 500
            assert "Failed to reload configuration" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_reload_all_configurations_error(self):
        """Test reload all configurations with error"""
        mock_manager = MagicMock()
        mock_manager.reload_all_configs.side_effect = Exception("Reload all error")
        
        with patch('app.controllers.config_controller.config_manager', mock_manager):
            with pytest.raises(HTTPException) as exc_info:
                await ConfigController.reload_all_configurations()
            
            assert exc_info.value.status_code == 500
            assert "Failed to reload all configurations" in str(exc_info.value.detail)
