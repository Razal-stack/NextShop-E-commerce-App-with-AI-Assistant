"""
Advanced API service layer with async processing, caching, and performance optimization.
"""
import time
import uuid
import base64
import io
from typing import Dict, Any, Optional, List
from PIL import Image
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.core.config import get_settings
from app.services.model_service import model_manager, ModelWrapper
from app.utils.logger import get_logger, log_request
from app.models.schemas import (
    TextGenerationRequest, 
    TextGenerationResponse,
    ImageDescriptionRequest, 
    ImageDescriptionResponse,
    ErrorResponse
)

settings = get_settings()
logger = get_logger("ai_server.api")


class InferenceException(Exception):
    """Custom exception for inference errors"""
    def __init__(self, message: str, error_code: str = "INFERENCE_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class APIService:
    """
    Advanced API service with async processing, error handling, and performance optimization.
    """
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="inference")
        self._request_cache: Dict[str, Any] = {}
        self._cache_ttl = 300  # 5 minutes cache TTL
    
    async def generate_text(self, request: TextGenerationRequest) -> TextGenerationResponse:
        """
        Generate text using the loaded language model with comprehensive error handling.
        """
        request_id = str(uuid.uuid4())
        
        with log_request(logger, request_id, "generate_text", prompt_length=len(request.prompt)):
            try:
                # Get language model
                llm_wrapper = model_manager.get_model("language")
                if not llm_wrapper or not llm_wrapper.is_loaded:
                    raise InferenceException(
                        "Language model is not loaded or unavailable",
                        "MODEL_NOT_LOADED"
                    )
                
                # Validate request parameters
                self._validate_text_generation_request(request)
                
                # Check cache (for identical requests)
                cache_key = self._generate_cache_key(request)
                cached_response = self._get_cached_response(cache_key)
                if cached_response:
                    logger.info(f"Returning cached response for request {request_id}")
                    llm_wrapper.update_request_metrics(True, 0)  # Cache hit
                    return cached_response
                
                # Perform inference
                start_time = time.time()
                
                response = await asyncio.get_event_loop().run_in_executor(
                    self.executor,
                    self._run_text_inference,
                    llm_wrapper,
                    request,
                    request_id
                )
                
                inference_time = (time.time() - start_time) * 1000
                llm_wrapper.update_request_metrics(True, inference_time)
                
                # Cache response
                self._cache_response(cache_key, response)
                
                return response
                
            except InferenceException:
                if 'llm_wrapper' in locals():
                    llm_wrapper.update_request_metrics(False, 0)
                raise
            except Exception as e:
                if 'llm_wrapper' in locals():
                    llm_wrapper.update_request_metrics(False, 0)
                logger.error(f"Unexpected error in text generation: {e}", exc_info=True)
                raise InferenceException(f"Text generation failed: {str(e)}", "UNEXPECTED_ERROR")
    
    def _run_text_inference(
        self, 
        llm_wrapper: ModelWrapper, 
        request: TextGenerationRequest,
        request_id: str
    ) -> TextGenerationResponse:
        """Run text inference in thread pool"""
        try:
            # Build the prompt with system context
            system_prompt = self._build_system_prompt()
            full_prompt = self._build_full_prompt(system_prompt, request)
            
            logger.debug(f"Running inference for request {request_id}")
            
            # Run inference
            output = llm_wrapper.model(
                full_prompt,
                max_tokens=request.max_tokens or settings.MAX_TOKENS_DEFAULT,
                temperature=request.temperature or settings.TEMPERATURE_DEFAULT,
                top_p=settings.TOP_P_DEFAULT,
                echo=False,
                stop=["Human:", "System:"],  # Stop tokens
            )
            
            # Process output
            response_text = self._process_llm_output(output)
            
            # Create response
            generation = {
                "text": response_text,
                "message": {
                    "content": response_text,
                    "role": "ai"
                }
            }
            
            return TextGenerationResponse(generations=[generation])
            
        except Exception as e:
            logger.error(f"Text inference failed for request {request_id}: {e}")
            raise InferenceException(f"Model inference failed: {str(e)}")
    
    def _build_system_prompt(self) -> str:
        """Build intelligent system prompt for e-commerce AI"""
        return (
            "You are NextShop's AI assistant. Your job is to select the right tools and parameters "
            "to answer user queries about products, carts, and orders. "
            "Do not answer directly. Instead, specify which tool to call with exact tool names and arguments. "
            "Output only tool call instructions in JSON format, e.g.:\n"
            '{"tool": "products.list", "args": {"category": "electronics", "priceMax": 50}}'
        )
    
    def _build_full_prompt(self, system_prompt: str, request: TextGenerationRequest) -> str:
        """Build the complete prompt with context"""
        full_prompt = f"System: {system_prompt}\n"
        
        # Add conversation context if provided
        if request.context:
            context_text = "\n".join([
                f"{msg.get('role', 'user')}: {msg.get('content', '')}" 
                for msg in request.context
            ])
            full_prompt += f"Previous conversation:\n{context_text}\n\n"
        
        full_prompt += f"Human: {request.prompt}\nAssistant:"
        return full_prompt
    
    def _process_llm_output(self, output: Dict[str, Any]) -> str:
        """Process and validate LLM output"""
        if not output or 'choices' not in output or not output['choices']:
            raise InferenceException("Model produced no output")
        
        response_text = output['choices'][0].get('text', '').strip()
        
        if not response_text:
            logger.warning("Model produced empty response")
            response_text = "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."
        
        return response_text
    
    async def describe_image(self, request: ImageDescriptionRequest) -> ImageDescriptionResponse:
        """
        Describe an image using the vision model with comprehensive error handling.
        """
        request_id = str(uuid.uuid4())
        
        with log_request(logger, request_id, "describe_image"):
            try:
                # Get vision model
                vision_wrapper = model_manager.get_model("vision")
                if not vision_wrapper or not vision_wrapper.is_loaded:
                    raise InferenceException(
                        "Vision model is not loaded or unavailable",
                        "MODEL_NOT_LOADED"
                    )
                
                # Validate and process image
                image = self._process_image_input(request.image_b64, request_id)
                
                # Check cache
                cache_key = f"vision_{hash(request.image_b64)}"
                cached_response = self._get_cached_response(cache_key)
                if cached_response:
                    logger.info(f"Returning cached vision response for request {request_id}")
                    vision_wrapper.update_request_metrics(True, 0)
                    return cached_response
                
                # Perform inference
                start_time = time.time()
                
                response = await asyncio.get_event_loop().run_in_executor(
                    self.executor,
                    self._run_vision_inference,
                    vision_wrapper,
                    image,
                    request_id
                )
                
                inference_time = (time.time() - start_time) * 1000
                vision_wrapper.update_request_metrics(True, inference_time)
                
                # Cache response
                self._cache_response(cache_key, response)
                
                return response
                
            except InferenceException:
                if 'vision_wrapper' in locals():
                    vision_wrapper.update_request_metrics(False, 0)
                raise
            except Exception as e:
                if 'vision_wrapper' in locals():
                    vision_wrapper.update_request_metrics(False, 0)
                logger.error(f"Unexpected error in image description: {e}", exc_info=True)
                raise InferenceException(f"Image description failed: {str(e)}", "UNEXPECTED_ERROR")
    
    def _process_image_input(self, image_b64: str, request_id: str) -> Image.Image:
        """Process and validate base64 image input"""
        try:
            # Handle data URL format
            image_data = image_b64.split(",")[-1] if "," in image_b64 else image_b64
            
            # Decode base64
            img_bytes = base64.b64decode(image_data)
            
            # Open and validate image
            image = Image.open(io.BytesIO(img_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Validate image size (prevent extremely large images)
            max_size = 2048
            if image.width > max_size or image.height > max_size:
                logger.warning(f"Large image detected ({image.width}x{image.height}), resizing for request {request_id}")
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            logger.error(f"Image processing failed for request {request_id}: {e}")
            raise InferenceException(f"Invalid image format: {str(e)}", "INVALID_IMAGE")
    
    def _run_vision_inference(
        self, 
        vision_wrapper: ModelWrapper, 
        image: Image.Image,
        request_id: str
    ) -> ImageDescriptionResponse:
        """Run vision inference in thread pool"""
        try:
            logger.debug(f"Running vision inference for request {request_id}")
            
            # Process image
            inputs = vision_wrapper.processor(image, return_tensors="pt").to(model_manager.device)
            
            # Generate caption
            with vision_wrapper.model.no_grad():
                outputs = vision_wrapper.model.generate(
                    **inputs,
                    max_new_tokens=50,
                    num_beams=4,
                    temperature=0.7,
                    do_sample=True,
                )
            
            # Decode caption
            caption = vision_wrapper.processor.decode(outputs[0], skip_special_tokens=True)
            
            # Clean up caption
            caption = self._clean_caption(caption)
            
            return ImageDescriptionResponse(caption=caption)
            
        except Exception as e:
            logger.error(f"Vision inference failed for request {request_id}: {e}")
            raise InferenceException(f"Vision model inference failed: {str(e)}")
    
    def _clean_caption(self, caption: str) -> str:
        """Clean and improve generated caption"""
        # Remove common artifacts
        caption = caption.strip()
        
        # Remove repetitive phrases
        if "a picture of a picture" in caption.lower():
            caption = caption.replace("a picture of a picture of", "a picture of")
        
        # Ensure proper capitalization
        if caption and not caption[0].isupper():
            caption = caption[0].upper() + caption[1:]
        
        # Ensure ending period
        if caption and not caption.endswith('.'):
            caption += '.'
        
        return caption
    
    def _validate_text_generation_request(self, request: TextGenerationRequest):
        """Validate text generation request parameters"""
        if not request.prompt or not request.prompt.strip():
            raise InferenceException("Empty prompt provided", "INVALID_REQUEST")
        
        if len(request.prompt) > 4000:  # Reasonable limit
            raise InferenceException("Prompt too long (max 4000 characters)", "INVALID_REQUEST")
        
        if request.max_tokens and (request.max_tokens < 1 or request.max_tokens > 2048):
            raise InferenceException("Invalid max_tokens (must be 1-2048)", "INVALID_REQUEST")
        
        if request.temperature and (request.temperature < 0.0 or request.temperature > 2.0):
            raise InferenceException("Invalid temperature (must be 0.0-2.0)", "INVALID_REQUEST")
    
    def _generate_cache_key(self, request: TextGenerationRequest) -> str:
        """Generate cache key for request"""
        # Create a simple hash-based cache key
        import hashlib
        content = f"{request.prompt}{request.max_tokens}{request.temperature}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_cached_response(self, cache_key: str) -> Optional[Any]:
        """Get cached response if valid"""
        if cache_key in self._request_cache:
            cached_item = self._request_cache[cache_key]
            if time.time() - cached_item['timestamp'] < self._cache_ttl:
                return cached_item['response']
            else:
                # Remove expired cache entry
                del self._request_cache[cache_key]
        return None
    
    def _cache_response(self, cache_key: str, response: Any):
        """Cache response with timestamp"""
        self._request_cache[cache_key] = {
            'response': response,
            'timestamp': time.time()
        }
        
        # Simple cache cleanup (remove old entries if cache gets too large)
        if len(self._request_cache) > 100:
            current_time = time.time()
            expired_keys = [
                key for key, item in self._request_cache.items()
                if current_time - item['timestamp'] > self._cache_ttl
            ]
            for key in expired_keys:
                del self._request_cache[key]
    
    async def get_service_health(self) -> Dict[str, Any]:
        """Get comprehensive service health status"""
        model_status = model_manager.get_health_status()
        
        return {
            "service": "ai_inference",
            "status": "healthy" if model_status["overall_healthy"] else "unhealthy",
            "timestamp": time.time(),
            "cache": {
                "entries": len(self._request_cache),
                "ttl_seconds": self._cache_ttl
            },
            "models": model_status,
            "executor": {
                "active_threads": self.executor._threads,
                "max_workers": self.executor._max_workers
            }
        }
    
    async def shutdown(self):
        """Cleanup service resources"""
        logger.info("Shutting down APIService...")
        self.executor.shutdown(wait=True)
        self._request_cache.clear()
        logger.info("APIService shutdown completed")


# Global API service instance
api_service = APIService()
