"""
Config Controller Layer - Handles configuration management
"""
import logging
from typing import Dict, Any, List
from fastapi import HTTPException

from app.core.config_manager import config_manager

logger = logging.getLogger(__name__)


class ConfigController:
    """Controller for configuration management endpoints"""
    
    @staticmethod
    async def list_configurations() -> Dict[str, Any]:
        """List all available configurations"""
        try:
            apps_info = config_manager.get_app_list_with_info()
            available_apps = config_manager.list_available_apps()
            
            return {
                "total_configurations": len(available_apps),
                "available_apps": available_apps,
                "configurations": apps_info,
                "status": "success"
            }
        
        except Exception as e:
            logger.error(f"Error listing configurations: {e}")
            raise HTTPException(status_code=500, detail="Failed to list configurations")
    
    @staticmethod
    async def get_configuration(app_name: str) -> Dict[str, Any]:
        """Get detailed configuration for specific app"""
        try:
            if not config_manager.config_exists(app_name):
                raise HTTPException(status_code=404, detail=f"Configuration for '{app_name}' not found")
            
            config = config_manager.get_config(app_name)
            
            return {
                "app_name": app_name,
                "configuration": config,
                "status": "success"
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting configuration for {app_name}: {e}")
            raise HTTPException(status_code=500, detail="Failed to get configuration")
    
    @staticmethod
    async def reload_configuration(app_name: str) -> Dict[str, Any]:
        """Reload specific app configuration"""
        try:
            success = config_manager.reload_config(app_name)
            
            if success:
                return {
                    "app_name": app_name,
                    "status": "reloaded",
                    "message": f"Configuration for '{app_name}' reloaded successfully"
                }
            else:
                raise HTTPException(status_code=404, detail=f"Configuration file for '{app_name}' not found")
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reloading configuration for {app_name}: {e}")
            raise HTTPException(status_code=500, detail="Failed to reload configuration")
    
    @staticmethod
    async def reload_all_configurations() -> Dict[str, Any]:
        """Reload all configurations"""
        try:
            config_manager.reload_all_configs()
            available_apps = config_manager.list_available_apps()
            
            return {
                "status": "reloaded",
                "total_configurations": len(available_apps),
                "available_apps": available_apps,
                "message": "All configurations reloaded successfully"
            }
        
        except Exception as e:
            logger.error(f"Error reloading all configurations: {e}")
            raise HTTPException(status_code=500, detail="Failed to reload all configurations")
