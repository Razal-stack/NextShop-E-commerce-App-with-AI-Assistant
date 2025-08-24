"""
Health Controller Layer - Handles health checks and system information
"""
import logging
import time
from typing import Dict, Any, List

from app.schemas import HealthResponse
from app.models import model_manager
from app.core.config_manager import config_manager

logger = logging.getLogger(__name__)

# Server start time for uptime calculation
_server_start_time = time.time()


class HealthController:
    """Controller for health and system endpoints"""
    
    @staticmethod
    async def get_health() -> HealthResponse:
        """Get server health status"""
        try:
            # Check model status with error handling
            models_loaded = []
            try:
                status = model_manager.get_status()
                if status.get("text_model_ready"):
                    models_loaded.extend([m for m in status.get("loaded_models", []) if m.startswith("text:")])
                if status.get("vision_model_ready"):
                    models_loaded.extend([m for m in status.get("loaded_models", []) if m.startswith("vision:")])
            except Exception as e:
                logger.warning(f"Could not get model status: {e}")
                models_loaded = ["status-check-failed"]
            
            # Calculate uptime
            uptime = time.time() - _server_start_time
            
            # Basic memory usage (if available)
            memory_usage = None
            try:
                import psutil
                process = psutil.Process()
                memory_usage = {
                    "rss_mb": round(process.memory_info().rss / 1024 / 1024, 1),
                    "vms_mb": round(process.memory_info().vms / 1024 / 1024, 1),
                    "cpu_percent": round(process.cpu_percent(), 1)
                }
            except ImportError:
                logger.info("psutil not available - memory usage will not be reported")
            except Exception as e:
                logger.warning(f"Could not get memory usage: {e}")
            
            return HealthResponse(
                status="healthy",
                version="1.0.0",
                models_loaded=models_loaded,
                memory_usage=memory_usage,
                uptime_seconds=round(uptime, 1)
            )
        
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return HealthResponse(
                status="unhealthy",
                version="1.0.0",
                models_loaded=[],
                memory_usage=None,
                uptime_seconds=round(time.time() - _server_start_time, 1)
            )
    
    @staticmethod
    async def get_server_info() -> Dict[str, Any]:
        """Get detailed server information"""
        try:
            # Model information
            status = model_manager.get_status()
            model_info = {
                "text_model_loaded": status.get("text_model_ready", False),
                "vision_model_loaded": status.get("vision_model_ready", False),
                "loaded_models": status.get("loaded_models", []),
                "available_models_count": status.get("available_models", 0),
                "device": status.get("device", "unknown")
            }
            
            # Available configurations
            available_configs = config_manager.list_available_apps()
            
            # System info
            system_info = {
                "uptime_seconds": time.time() - _server_start_time,
                "available_configs": available_configs,
                "total_configs": len(available_configs)
            }
            
            return {
                "server_status": "running",
                "model_info": model_info,
                "system_info": system_info,
                "endpoints": {
                    "health": "/health",
                    "server_info": "/server-info",
                    "generic_reasoning": "/reasoning/generic",
                    "app_reasoning": "/reasoning/app",
                    "image_reasoning": "/reasoning/image",
                    "config_list": "/config/list",
                    "config_detail": "/config/{app_name}"
                }
            }
        
        except Exception as e:
            logger.error(f"Error getting server info: {e}")
            return {
                "server_status": "error",
                "error": str(e),
                "uptime_seconds": time.time() - _server_start_time
            }
