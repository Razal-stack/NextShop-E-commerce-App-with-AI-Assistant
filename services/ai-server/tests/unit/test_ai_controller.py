"""
Unit tests for AI Controller
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException

from app.controllers.ai_controller import AIController
from app.schemas import ReasoningRequest, AppSpecificReasoningRequest, ImageReasoningRequest


class TestAIController:
    """Test cases for AI Controller"""
    
    @pytest.mark.asyncio
    async def test_handle_generic_reasoning_success(self, sample_reasoning_request):
        """Test successful generic reasoning"""
        request = ReasoningRequest(**sample_reasoning_request)
        
        with patch('app.controllers.ai_controller.AIService.process_generic_reasoning') as mock_service:
            mock_service.return_value = {
                "result": "2+2 equals 4",
                "processing_time_ms": 100.0,
                "model_used": "test_model",
                "task_type": "reasoning",
                "confidence": None,
                "reasoning_steps": None
            }
            
            response = await AIController.handle_generic_reasoning(request)
            
            assert response.result == "2+2 equals 4"
            assert response.processing_time_ms == 100.0
            assert response.model_used == "test_model"
            mock_service.assert_called_once_with(
                instruction="What is 2+2?",
                context="Math problem",
                parameters={"max_tokens": 50, "temperature": 0.1}
            )
    
    @pytest.mark.asyncio
    async def test_handle_generic_reasoning_validation_error(self):
        """Test validation error handling"""
        with patch('app.controllers.ai_controller.AIService.process_generic_reasoning') as mock_service:
            mock_service.side_effect = ValueError("Instruction cannot be empty")
            
            request = ReasoningRequest(
                instruction="", 
                context=None, 
                parameters={}
            )
            
            with pytest.raises(HTTPException) as exc_info:
                await AIController.handle_generic_reasoning(request)
            
            assert exc_info.value.status_code == 400
            assert "Instruction cannot be empty" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_handle_generic_reasoning_timeout(self):
        """Test timeout handling"""
        import asyncio
        
        request = ReasoningRequest(
            instruction="Test", 
            context=None, 
            parameters={}
        )
        
        with patch('app.controllers.ai_controller.AIService.process_generic_reasoning') as mock_service:
            # Mock a function that takes too long
            async def slow_function(*args, **kwargs):
                await asyncio.sleep(1)  # Longer than our test timeout
                return {"result": "test"}
                
            mock_service.side_effect = slow_function
            
            # Patch the timeout to be very short for testing
            with patch('app.controllers.ai_controller.REQUEST_TIMEOUT', 0.1):
                with pytest.raises(HTTPException) as exc_info:
                    await AIController.handle_generic_reasoning(request)
                
                assert exc_info.value.status_code == 408
                assert "timeout" in str(exc_info.value.detail).lower()
    
    @pytest.mark.asyncio
    async def test_handle_app_reasoning_success(self, sample_app_request):
        """Test successful app-specific reasoning"""
        request = AppSpecificReasoningRequest(**sample_app_request)
        
        with patch('app.controllers.ai_controller.AIService.process_app_specific_reasoning') as mock_service:
            mock_service.return_value = {
                "raw_llm_response": "Here are the products",
                "original_response": "Here are the products",
                "app_name": "test_app",
                "processing_successful": True,
                "processing_time_ms": 150.0,
                "model_used": "test_model",
                "requires_conversation_context": False
            }
            
            response = await AIController.handle_app_reasoning(request)
            
            assert response["raw_llm_response"] == "Here are the products"
            assert response["app_name"] == "test_app"
            assert response["processing_successful"] is True
            
            # Verify the service was called with the entire request as context
            mock_service.assert_called_once()
            args, kwargs = mock_service.call_args
            assert kwargs["app_name"] == "test_app"
            assert kwargs["user_query"] == "Show me products"
            assert "available_categories" in kwargs["context_data"]
    
    @pytest.mark.asyncio
    async def test_handle_image_reasoning_success(self, sample_image_request):
        """Test successful image reasoning"""
        request = ImageReasoningRequest(**sample_image_request)
        
        with patch('app.controllers.ai_controller.AIService.process_image_reasoning') as mock_service:
            mock_service.return_value = {
                "result": "I see a test image",
                "processing_time_ms": 200.0,
                "model_used": "vision_model",
                "task_type": "image_reasoning",
                "confidence": None,
                "reasoning_steps": None
            }
            
            response = await AIController.handle_image_reasoning(request)
            
            assert response.result == "I see a test image"
            assert response.task_type == "image_reasoning"
            assert response.model_used == "vision_model"
            mock_service.assert_called_once_with(
                instruction="What do you see in this image?",
                image_data=sample_image_request["image_data"],
                parameters={"max_tokens": 100}
            )
