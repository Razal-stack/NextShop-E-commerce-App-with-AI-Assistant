"""
Configuration routes - delegates to config controller
"""
from fastapi import APIRouter
from typing import Dict, Any

from app.controllers.config_controller import ConfigController

router = APIRouter()


@router.get("/apps")
async def list_configurations() -> Dict[str, Any]:
    """List all available app configurations"""
    return await ConfigController.list_configurations()


@router.get("/apps/{app_name}/config")
async def get_configuration(app_name: str) -> Dict[str, Any]:
    """Get configuration for specific app"""
    return await ConfigController.get_configuration(app_name)


@router.post("/apps/{app_name}/reload")
async def reload_configuration(app_name: str) -> Dict[str, Any]:
    """Reload configuration for specific app"""
    return await ConfigController.reload_configuration(app_name)


@router.post("/config/reload-all")
async def reload_all_configurations() -> Dict[str, Any]:
    """Reload all configurations"""
    return await ConfigController.reload_all_configurations()
