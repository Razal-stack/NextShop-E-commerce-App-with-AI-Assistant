"""
Production-grade FastAPI endpoints with comprehensive error handling and monitoring.
"""
import time
import uuid
from typing import Dict, Any
from contextlib import asynccontextmanager

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import JSONResponse, StreamingResponse

from ..services.model_service import ModelManager
from ..services.api_service import APIService
from ..models.schemas import (
    TextGenerationRequest,
    TextGenerationResponse,
    ImageDescriptionRequest,
    ImageDescriptionResponse,
    HealthResponse,
    ModelInfoResponse,
    ErrorResponse,
    SuccessResponse
)
from ..utils.logger import get_logger
from ..core.exceptions import ValidationError, ModelNotLoadedError, ProcessingError

# Initialize logger and router
logger = get_logger(__name__)
router = APIRouter()


# Dependency injection
async def get_request_id() -> str:
    """Generate unique request ID for tracking"""
    return str(uuid.uuid4())


async def log_request(request: Request, request_id: str):
    """Log incoming request details"""
    logger.info(
        "Incoming request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host,
            "user_agent": request.headers.get("user-agent")
        }
    )


# Error handlers
async def handle_api_error(error: Exception, request_id: str) -> JSONResponse:
    """Centralized error handling"""
    logger.error(
        f"API error occurred: {str(error)}",
        extra={
            "request_id": request_id,
            "error_type": type(error).__name__,
            "error_details": str(error)
        },
        exc_info=True
    )
    
    if isinstance(error, ValidationError):
        status_code = 422
        error_code = "VALIDATION_ERROR"
    elif isinstance(error, ModelNotLoadedError):
        status_code = 503
        error_code = "MODEL_NOT_LOADED"
    elif isinstance(error, ProcessingError):
        status_code = 500
        error_code = "PROCESSING_ERROR"
    else:
        status_code = 500
        error_code = "INTERNAL_ERROR"
    
    error_response = ErrorResponse(
        error={
            "code": error_code,
            "message": str(error),
            "field": getattr(error, 'field', None)
        },
        timestamp=time.time(),
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status_code,
        content=error_response.dict()
    )


# Endpoints

@router.post(
    "/generate",
    response_model=TextGenerationResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation Error"},
        503: {"model": ErrorResponse, "description": "Model Not Available"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    },
    summary="Generate text response",
    description="Generate AI text response for user prompts with conversation context support"
)
async def generate_text(
    request: TextGenerationRequest,
    background_tasks: BackgroundTasks,
    api_service: APIService = Depends(get_api_service),
    request_id: str = Depends(get_request_id),
    http_request: Request = None
):
    """
    Generate text response using the language model.
    
    - **prompt**: The input prompt for text generation
    - **context**: Optional conversation context
    - **max_tokens**: Maximum tokens to generate (1-2048)
    - **temperature**: Sampling temperature (0.0-2.0)
    - **top_p**: Top-p sampling parameter (0.0-1.0)
    - **stream**: Enable streaming response
    """
    start_time = time.time()
    
    # Log request
    if http_request:
        background_tasks.add_task(log_request, http_request, request_id)
    
    try:
        # Validate request
        if not request.prompt.strip():
            raise ValidationError("Prompt cannot be empty", field="prompt")
        
        logger.info(
            "Processing text generation request",
            extra={
                "request_id": request_id,
                "prompt_length": len(request.prompt),
                "context_messages": len(request.context) if request.context else 0,
                "max_tokens": request.max_tokens,
                "temperature": request.temperature
            }
        )
        
        # Generate response
        response = await api_service.generate_text(
            request=request,
            request_id=request_id
        )
        
        # Add processing time
        processing_time = (time.time() - start_time) * 1000
        response.processing_time_ms = processing_time
        
        logger.info(
            "Text generation completed",
            extra={
                "request_id": request_id,
                "processing_time_ms": processing_time,
                "response_length": len(response.generations[0].text) if response.generations else 0
            }
        )
        
        return response
        
    except Exception as e:
        return await handle_api_error(e, request_id)


@router.post(
    "/describe-image",
    response_model=ImageDescriptionResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation Error"},
        503: {"model": ErrorResponse, "description": "Model Not Available"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    },
    summary="Describe image content",
    description="Generate descriptive caption for uploaded images using vision model"
)
async def describe_image(
    request: ImageDescriptionRequest,
    background_tasks: BackgroundTasks,
    api_service: APIService = Depends(get_api_service),
    request_id: str = Depends(get_request_id),
    http_request: Request = None
):
    """
    Generate description for uploaded image.
    
    - **image_b64**: Base64 encoded image data (JPEG, PNG)
    - **max_length**: Maximum description length in words (10-100)
    """
    start_time = time.time()
    
    # Log request
    if http_request:
        background_tasks.add_task(log_request, http_request, request_id)
    
    try:
        # Validate image data
        if len(request.image_b64) < 100:
            raise ValidationError("Image data too small", field="image_b64")
        
        logger.info(
            "Processing image description request",
            extra={
                "request_id": request_id,
                "image_data_length": len(request.image_b64),
                "max_length": request.max_length
            }
        )
        
        # Generate description
        response = await api_service.describe_image(
            request=request,
            request_id=request_id
        )
        
        # Add processing time
        processing_time = (time.time() - start_time) * 1000
        response.processing_time_ms = processing_time
        
        logger.info(
            "Image description completed",
            extra={
                "request_id": request_id,
                "processing_time_ms": processing_time,
                "caption_length": len(response.caption)
            }
        )
        
        return response
        
    except Exception as e:
        return await handle_api_error(e, request_id)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Get comprehensive system health status including model availability and performance metrics"
)
async def health_check(
    api_service: APIService = Depends(get_api_service),
    request_id: str = Depends(get_request_id)
):
    """
    Comprehensive health check endpoint.
    
    Returns system status, model availability, and performance metrics.
    """
    try:
        logger.debug(
            "Processing health check request",
            extra={"request_id": request_id}
        )
        
        health_data = await api_service.get_health_status(request_id)
        
        logger.debug(
            "Health check completed",
            extra={
                "request_id": request_id,
                "status": health_data.status,
                "total_models": len(health_data.models)
            }
        )
        
        return health_data
        
    except Exception as e:
        logger.error(
            f"Health check failed: {str(e)}",
            extra={"request_id": request_id},
            exc_info=True
        )
        
        # For health checks, we still want to return some status
        return HealthResponse(
            status="unhealthy",
            timestamp=time.time(),
            models={},
            system={
                "error": str(e),
                "total_models": 0,
                "loaded_models": 0,
                "healthy_models": 0
            }
        )


@router.get(
    "/models",
    response_model=ModelInfoResponse,
    summary="Get model information",
    description="Get information about available models and current configuration"
)
async def get_models_info(
    model_manager: ModelManager = Depends(get_model_manager),
    request_id: str = Depends(get_request_id)
):
    """
    Get detailed information about available models.
    
    Returns model directory, detected models, and configuration details.
    """
    try:
        logger.debug(
            "Processing models info request",
            extra={"request_id": request_id}
        )
        
        models_info = await model_manager.get_models_info()
        
        logger.debug(
            "Models info completed",
            extra={
                "request_id": request_id,
                "total_models": models_info["total_models"]
            }
        )
        
        return ModelInfoResponse(**models_info)
        
    except Exception as e:
        return await handle_api_error(e, request_id)


@router.post(
    "/models/reload",
    response_model=SuccessResponse,
    summary="Reload models",
    description="Reload all models from the models directory"
)
async def reload_models(
    background_tasks: BackgroundTasks,
    model_manager: ModelManager = Depends(get_model_manager),
    request_id: str = Depends(get_request_id)
):
    """
    Reload all models from the models directory.
    
    This will detect new models and reload existing ones.
    """
    try:
        logger.info(
            "Processing models reload request",
            extra={"request_id": request_id}
        )
        
        # Reload models in background
        background_tasks.add_task(
            model_manager.reload_models,
            request_id
        )
        
        logger.info(
            "Models reload initiated",
            extra={"request_id": request_id}
        )
        
        return SuccessResponse(
            data={"message": "Models reload initiated"},
            timestamp=time.time()
        )
        
    except Exception as e:
        return await handle_api_error(e, request_id)


# Export router
__all__ = ["router"]
