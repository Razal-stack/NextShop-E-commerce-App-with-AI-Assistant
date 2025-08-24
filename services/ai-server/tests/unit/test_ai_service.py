"""
Unit tests for AI Service
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from app.services.ai_service import AIService
from app.schemas import ReasoningRequest, AppSpecificReasoningRequest, ImageReasoningRequest


class TestAIService:
    """Test cases for AI Service"""
    
    @pytest.fixture
    def sample_reasoning_request(self):
        """Sample reasoning request for testing"""
        return ReasoningRequest(
            instruction="What are the best smartphones?",
            context="E-commerce context",
            parameters={"max_tokens": 100, "temperature": 0.7}
        )
    
    @pytest.fixture
    def sample_app_request(self):
        """Sample app-specific request for testing"""
        return AppSpecificReasoningRequest(
            app_name="ecommerce",
            user_query="Show me laptops under $1000",
            available_categories=["electronics", "computers"],
            conversation_history=None,
            mcp_tools_context=None,
            ui_handlers_context=None,
            current_filters={"price_max": 1000},
            user_session=None
        )
    
    @pytest.fixture
    def mock_model_manager(self):
        """Mock model manager"""
        mock_manager = MagicMock()
        mock_manager.generate_text = AsyncMock(return_value={
            "result": "Test AI response",
            "model_used": "test-model"
        })
        mock_manager.analyze_image = AsyncMock(return_value={
            "result": "Test image analysis",
            "model_used": "vision-model"
        })
        mock_manager.vision_model = None
        mock_manager.initialize_vision_model = AsyncMock()
        return mock_manager
    
    @pytest.fixture
    def mock_config_manager(self):
        """Mock config manager"""
        mock_manager = MagicMock()
        mock_manager.get_config.return_value = {
            "llm": {
                "system_prompt": "You are a helpful {app_name} assistant. Query: {user_query}",
                "context_message": "Additional context",
                "parameters": {"max_tokens": 300, "temperature": 0.1}
            }
        }
        return mock_manager
    
    @pytest.mark.asyncio
    async def test_process_generic_reasoning_success(self, sample_reasoning_request, mock_model_manager):
        """Test successful generic reasoning"""
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            response = await AIService.process_generic_reasoning(
                instruction=sample_reasoning_request.instruction,
                context=sample_reasoning_request.context,
                parameters=sample_reasoning_request.parameters
            )
            
            assert response["result"] == "Test AI response"
            assert response["model_used"] == "test-model"
            assert response["processing_time_ms"] > 0
            assert response["confidence"] is None
            assert response["reasoning_steps"] is None
    
    @pytest.mark.asyncio
    async def test_process_generic_reasoning_empty_instruction(self):
        """Test generic reasoning with empty instruction"""
        with pytest.raises(ValueError) as exc_info:
            await AIService.process_generic_reasoning("")
        
        assert "Instruction cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_generic_reasoning_model_error(self, mock_model_manager):
        """Test generic reasoning with model error"""
        mock_model_manager.generate_text.side_effect = Exception("Model error")
        
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            with pytest.raises(ValueError) as exc_info:
                await AIService.process_generic_reasoning("Test instruction")
            
            assert "Text generation failed" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_app_specific_reasoning_success(self, sample_app_request, mock_model_manager, mock_config_manager):
        """Test successful app-specific reasoning"""
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            with patch('app.services.ai_service.config_manager', mock_config_manager):
                response = await AIService.process_app_specific_reasoning(
                    app_name=sample_app_request.app_name,
                    user_query=sample_app_request.user_query,
                    context_data={
                        "available_categories": sample_app_request.available_categories,
                        "current_filters": sample_app_request.current_filters
                    }
                )
                
                assert response["raw_llm_response"] == "Test AI response"
                assert response["app_name"] == "ecommerce"
                assert response["processing_successful"] is True
                assert response["processing_time_ms"] > 0
                assert response["model_used"] == "test-model"
    
    @pytest.mark.asyncio
    async def test_process_app_specific_reasoning_empty_app_name(self, mock_config_manager):
        """Test app-specific reasoning with empty app name"""
        with patch('app.services.ai_service.config_manager', mock_config_manager):
            with pytest.raises(ValueError) as exc_info:
                await AIService.process_app_specific_reasoning(
                    app_name="",
                    user_query="test query",
                    context_data={}
                )
            
            assert "App name cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_app_specific_reasoning_empty_query(self, mock_config_manager):
        """Test app-specific reasoning with empty query"""
        with patch('app.services.ai_service.config_manager', mock_config_manager):
            with pytest.raises(ValueError) as exc_info:
                await AIService.process_app_specific_reasoning(
                    app_name="ecommerce",
                    user_query="",
                    context_data={}
                )
            
            assert "User query cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_app_specific_reasoning_no_config(self, mock_model_manager):
        """Test app-specific reasoning with missing config"""
        mock_config_manager = MagicMock()
        mock_config_manager.get_config.return_value = None
        
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            with patch('app.services.ai_service.config_manager', mock_config_manager):
                with pytest.raises(ValueError) as exc_info:
                    await AIService.process_app_specific_reasoning(
                        app_name="nonexistent",
                        user_query="test query",
                        context_data={}
                    )
                
                assert "configuration not found" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_app_specific_reasoning_template_error(self, mock_model_manager):
        """Test app-specific reasoning with template formatting error"""
        mock_config_manager = MagicMock()
        mock_config_manager.get_config.return_value = {
            "llm": {
                "system_prompt": "Missing field: {nonexistent_field}",
                "parameters": {"max_tokens": 300}
            }
        }
        
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            with patch('app.services.ai_service.config_manager', mock_config_manager):
                response = await AIService.process_app_specific_reasoning(
                    app_name="test_app",
                    user_query="test query",
                    context_data={}
                )
                
                # Should still succeed with fallback prompt
                assert response["processing_successful"] is True
                assert response["app_name"] == "test_app"
    
    @pytest.mark.asyncio
    async def test_process_image_reasoning_success(self, mock_model_manager):
        """Test successful image reasoning"""
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            response = await AIService.process_image_reasoning(
                instruction="Describe this image",
                image_data="base64_image_data",
                parameters={"max_tokens": 200}
            )
            
            assert response["result"] == "Test image analysis"
            assert response["model_used"] == "vision-model"
            assert response["task_type"] == "image_reasoning"
            assert response["processing_time_ms"] > 0
    
    @pytest.mark.asyncio
    async def test_process_image_reasoning_empty_instruction(self):
        """Test image reasoning with empty instruction"""
        with pytest.raises(ValueError) as exc_info:
            await AIService.process_image_reasoning("", "image_data")
        
        assert "Instruction cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_image_reasoning_empty_image_data(self):
        """Test image reasoning with empty image data"""
        with pytest.raises(ValueError) as exc_info:
            await AIService.process_image_reasoning("Analyze image", "")
        
        assert "Image data cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_image_reasoning_vision_model_initialization(self, mock_model_manager):
        """Test image reasoning with vision model initialization"""
        # Mock vision model not loaded initially
        mock_model_manager.vision_model = None
        
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            await AIService.process_image_reasoning(
                instruction="Analyze image",
                image_data="base64_data"
            )
            
            # Verify vision model initialization was called
            mock_model_manager.initialize_vision_model.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_process_image_reasoning_model_error(self, mock_model_manager):
        """Test image reasoning with model error"""
        mock_model_manager.analyze_image.side_effect = Exception("Vision model error")
        
        with patch('app.services.ai_service.model_manager', mock_model_manager):
            with pytest.raises(ValueError) as exc_info:
                await AIService.process_image_reasoning(
                    instruction="Analyze image",
                    image_data="base64_data"
                )
            
            assert "Image reasoning failed" in str(exc_info.value)
