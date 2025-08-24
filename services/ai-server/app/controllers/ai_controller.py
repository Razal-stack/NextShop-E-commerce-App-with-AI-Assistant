"""
AI Controller Layer - Handles request/response logic and validation
"""
import logging
import asyncio
from typing import Dict, Any, Optional

from fastapi import HTTPException
from pydantic import ValidationError

from app.schemas import (
    ReasoningRequest, 
    AppSpecificReasoningRequest,
    ImageReasoningRequest,
    ReasoningResponse
)
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

# Request timeout in seconds
REQUEST_TIMEOUT = 300  # 5 minutes for GGUF model processing


class AIController:
    """Controller for AI-related endpoints"""
    
    @staticmethod
    async def handle_generic_reasoning(request: ReasoningRequest) -> ReasoningResponse:
        """Handle generic reasoning request"""
        try:
            # Add timeout protection
            result = await asyncio.wait_for(
                AIService.process_generic_reasoning(
                    instruction=request.instruction,
                    context=request.context,
                    parameters=request.parameters
                ),
                timeout=REQUEST_TIMEOUT
            )
            
            return ReasoningResponse(**result)
        
        except asyncio.TimeoutError:
            logger.error(f"Generic reasoning timed out after {REQUEST_TIMEOUT}s")
            raise HTTPException(status_code=408, detail="Request timeout: Processing took too long")
        
        except ValueError as e:
            logger.error(f"Validation error in generic reasoning: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        
        except Exception as e:
            logger.error(f"Error in generic reasoning: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    @staticmethod
    async def handle_app_reasoning(request: AppSpecificReasoningRequest) -> Dict[str, Any]:
        """Handle app-specific reasoning request - completely generic"""
        try:
            # Convert the entire request to a dictionary - let the service handle what it needs
            # This way we don't hardcode any app-specific field names in the controller
            request_dict = request.model_dump()
            
            # Add timeout protection
            result = await asyncio.wait_for(
                AIService.process_app_specific_reasoning(
                    app_name=request.app_name,
                    user_query=request.user_query,
                    context_data=request_dict  # Pass the entire request as context
                ),
                timeout=REQUEST_TIMEOUT
            )
            
            return result
        
        except asyncio.TimeoutError:
            logger.error(f"App reasoning timed out after {REQUEST_TIMEOUT}s for app: {request.app_name}")
            raise HTTPException(status_code=408, detail="Request timeout: Processing took too long")
        
        except ValueError as e:
            logger.error(f"Validation error in app reasoning: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        
        except Exception as e:
            logger.error(f"Error in app reasoning: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    @staticmethod
    async def handle_image_reasoning(request: ImageReasoningRequest) -> ReasoningResponse:
        """Handle image-based reasoning request"""
        try:
            # Add timeout protection (longer for image processing)
            image_timeout = REQUEST_TIMEOUT * 2  # 4 minutes for image processing
            result = await asyncio.wait_for(
                AIService.process_image_reasoning(
                    instruction=request.instruction,
                    image_data=request.image_data,
                    parameters=request.parameters
                ),
                timeout=image_timeout
            )
            
            return ReasoningResponse(**result)
        
        except asyncio.TimeoutError:
            logger.error(f"Image reasoning timed out after {REQUEST_TIMEOUT * 2}s")
            raise HTTPException(status_code=408, detail="Request timeout: Image processing took too long")
        
        except ValueError as e:
            logger.error(f"Validation error in image reasoning: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        
        except Exception as e:
            logger.error(f"Error in image reasoning: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
