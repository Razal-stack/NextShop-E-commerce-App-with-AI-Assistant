"""
Health check routes - delegates to health controller
"""
from fastapi import APIRouter
from typing import Dict, Any

from app.controllers.health_controller import HealthController
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/", response_model=dict)
async def root():
    """Root endpoint with server information"""
    return await HealthController.get_server_info()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Get server health status"""
    return await HealthController.get_health()


@router.get("/server-info")
async def server_info() -> Dict[str, Any]:
    """Get detailed server information"""
    return await HealthController.get_server_info()
