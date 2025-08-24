"""
AI reasoning routes - delegates to AI controller
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import ValidationError

from app.controllers.ai_controller import AIController
from app.schemas import ReasoningRequest, AppSpecificReasoningRequest, ImageReasoningRequest, ReasoningResponse

router = APIRouter()


@router.post("/reason", response_model=ReasoningResponse)
async def generic_reasoning(request: ReasoningRequest):
    """Generic AI reasoning endpoint"""
    try:
        return await AIController.handle_generic_reasoning(request)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")


@router.post("/app-reason")
async def app_specific_reasoning(request: AppSpecificReasoningRequest) -> Dict[str, Any]:
    """App-specific reasoning with dynamic configuration"""
    try:
        return await AIController.handle_app_reasoning(request)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")


@router.post("/reason-image", response_model=ReasoningResponse)
async def image_reasoning(request: ImageReasoningRequest):
    """Image-based reasoning endpoint"""
    try:
        return await AIController.handle_image_reasoning(request)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")
