"""
Request/Response schemas for AI reasoning server
"""
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class ReasoningRequest(BaseModel):
    """Request for AI reasoning task"""
    instruction: str = Field(..., description="The instruction/prompt for the AI")
    context: Optional[str] = Field(None, description="Additional context information")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Generation parameters")
    task_type: str = Field(default="reasoning", description="Type of AI task")


class AppSpecificReasoningRequest(BaseModel):
    """Request for app-specific reasoning with execution planning"""
    app_name: str = Field(..., description="Name of the calling application")
    user_query: str = Field(..., description="User's natural language query")
    available_categories: Optional[List[str]] = Field(None, description="Available product categories")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(None, description="Previous conversation turns")
    mcp_tools_context: Optional[List[Dict[str, Any]]] = Field(None, description="Available MCP tools")
    ui_handlers_context: Optional[List[Dict[str, Any]]] = Field(None, description="Available UI handlers")
    current_filters: Optional[Dict[str, Any]] = Field(None, description="Currently applied filters")
    user_session: Optional[Dict[str, Any]] = Field(None, description="User session information")


class AppSpecificReasoningResponse(BaseModel):
    """Response with LLM analysis only - NO execution planning (that's for LangChain backend)"""
    query_analysis: Dict[str, Any] = Field(..., description="Analysis of the user query")
    execution_plan: List[Dict[str, Any]] = Field(default=[], description="Empty - execution planning handled by LangChain backend")
    fallback_response: Optional[str] = Field(None, description="Direct response if no plan needed")
    expected_result_format: str = Field(..., description="Expected format of results")
    ui_guidance: Optional[str] = Field(None, description="Guidance for UI handling")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    model_used: str = Field(..., description="Model used for analysis")
    app_config_used: str = Field(..., description="App configuration used")


class AppSpecificImageReasoningRequest(BaseModel):
    """Request for app-specific reasoning with image"""
    app_name: str = Field(..., description="Name of the calling application")
    user_query: str = Field(..., description="User's natural language query about the image")
    image_data: str = Field(..., description="Base64 encoded image data")
    image_format: str = Field(default="jpeg", description="Image format (jpeg, png, etc.)")
    available_categories: Optional[List[str]] = Field(None, description="Available product categories")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(None, description="Previous conversation turns")
    mcp_tools_context: Optional[List[Dict[str, Any]]] = Field(None, description="Available MCP tools")
    ui_handlers_context: Optional[List[Dict[str, Any]]] = Field(None, description="Available UI handlers")
    current_filters: Optional[Dict[str, Any]] = Field(None, description="Currently applied filters")
    user_session: Optional[Dict[str, Any]] = Field(None, description="User session information")


class ImageReasoningRequest(BaseModel):
    """Request for image-based reasoning"""
    instruction: str = Field(..., description="What to analyze about the image")
    image_data: str = Field(..., description="Base64 encoded image data")
    image_format: str = Field(default="jpeg", description="Image format (jpeg, png, etc.)")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ReasoningResponse(BaseModel):
    """Response from AI reasoning"""
    result: str = Field(..., description="The AI reasoning result")
    confidence: Optional[float] = Field(None, description="Confidence score if available")
    reasoning_steps: Optional[List[str]] = Field(None, description="Step-by-step reasoning process")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    model_used: str = Field(..., description="Model used for reasoning")
    task_type: str = Field(..., description="Type of task performed")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Server status")
    version: str = Field(..., description="Server version")
    models_loaded: List[str] = Field(..., description="Currently loaded models")
    memory_usage: Optional[Dict[str, float]] = Field(None, description="Memory usage stats")
    uptime_seconds: float = Field(..., description="Server uptime")


class ErrorResponse(BaseModel):
    """Error response"""
    error: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code")
    timestamp: float = Field(..., description="Error timestamp")
