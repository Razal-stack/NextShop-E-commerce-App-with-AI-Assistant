"""
AI Service Layer - Handles LLM interactions and processing
"""
import json
import logging
import time
from typing import Dict, Any, Optional

from app.models import model_manager
from app.core.config_manager import config_manager
from app.utils import complete_json_structure, is_json_response

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-related operations"""
    
    @staticmethod
    async def process_generic_reasoning(instruction: str, context: Optional[str] = None, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process generic reasoning request"""
        start_time = time.time()
        
        # Validate instruction
        if not instruction or not instruction.strip():
            raise ValueError("Instruction cannot be empty")
        
        logger.info(f"Processing generic reasoning: {instruction[:100]}...")
        
        try:
            # Generate AI response
            params = parameters or {}
            result = await model_manager.generate_text(
                instruction=instruction,
                context=context,
                **params
            )
            
            processing_time = (time.time() - start_time) * 1000
            
            return {
                "result": result["result"],
                "processing_time_ms": processing_time,
                "model_used": result["model_used"],
                "task_type": "reasoning",
                "confidence": None,
                "reasoning_steps": None
            }
            
        except Exception as e:
            logger.error(f"Failed to generate text: {e}")
            raise ValueError(f"Text generation failed: {str(e)}")
    
    @staticmethod
    async def process_app_specific_reasoning(app_name: str, user_query: str, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process app-specific reasoning with dynamic configuration"""
        start_time = time.time()
        
        # Validate inputs
        if not app_name or not app_name.strip():
            raise ValueError("App name cannot be empty")
        if not user_query or not user_query.strip():
            raise ValueError("User query cannot be empty")
        
        logger.info(f"Processing app-specific reasoning for '{app_name}': {user_query[:100]}...")
        
        try:
            # Get app configuration
            app_config = config_manager.get_config(app_name)
            if not app_config:
                raise ValueError(f"App '{app_name}' configuration not found")
            
            # Extract LLM settings with defaults
            llm_config = app_config.get('llm', {})
            system_prompt_template = llm_config.get('system_prompt', 'Analyze the query: "{user_query}"')
            context_message = llm_config.get('context_message', None)
            llm_parameters = llm_config.get('parameters', {"max_tokens": 300, "temperature": 0.1})  # Updated default
            
            # Performance settings for token management
            performance_config = llm_config.get('performance', {})
            max_context_tokens = performance_config.get('max_context_tokens', 1500)
            warn_threshold = performance_config.get('warn_threshold', 1200)
            enable_token_tracking = performance_config.get('enable_token_tracking', True)
            
            # Build prompt using template - Generic for all apps
            try:
                # Standard template variables - app config determines what it needs
                template_vars = {
                    'user_query': user_query,
                    'available_categories': str(context_data.get('available_categories', [])),
                    'mcp_tools_context': str(context_data.get('mcp_tools_context', [])),
                    'ui_handlers_context': str(context_data.get('ui_handlers_context', [])),
                    'conversation_history': str(context_data.get('conversation_history', [])),
                    'current_filters': str(context_data.get('current_filters', {})),
                    'user_session': str(context_data.get('user_session', {}))
                }
                
                llm_prompt = system_prompt_template.format(**template_vars)
                logger.info(f"Template formatted successfully for '{app_name}'")
                
                # Token tracking and context optimization
                if enable_token_tracking:
                    # Import token estimation function
                    from app.models import estimate_tokens, log_token_usage
                    
                    # Check prompt size and warn if too large
                    prompt_tokens = estimate_tokens(llm_prompt)
                    context_tokens = estimate_tokens(context_message) if context_message else 0
                    total_context_tokens = prompt_tokens + context_tokens
                    
                    logger.info(f"CONTEXT SIZE CHECK - Prompt: {prompt_tokens} tokens, Context: {context_tokens} tokens, Total: {total_context_tokens}")
                    
                    if total_context_tokens > max_context_tokens:
                        logger.error(f"CONTEXT TOO LARGE: {total_context_tokens} tokens exceeds limit of {max_context_tokens}! This WILL cause slowdowns!")
                        # Truncate the system prompt to reduce size
                        words = llm_prompt.split()
                        max_words = int(max_context_tokens * 0.75)  # Use 75% of limit for prompt
                        if len(words) > max_words:
                            llm_prompt = ' '.join(words[:max_words]) + '\n\n[Truncated for performance]'
                            logger.warning(f"Truncated prompt from {len(words)} to {max_words} words")
                    elif total_context_tokens > warn_threshold:
                        logger.warning(f"HIGH CONTEXT SIZE: {total_context_tokens} tokens may cause slowdowns (threshold: {warn_threshold})")
                
            except KeyError as e:
                logger.warning(f"Template formatting error - missing variable {e}. Using simple prompt.")
                llm_prompt = f"Analyze this query and create execution plan: {user_query}"
            except Exception as e:
                logger.warning(f"Unexpected template error: {e}. Using simple prompt.")
                llm_prompt = f"Analyze this query and create execution plan: {user_query}"
            
            # Call LLM
            llm_result = await model_manager.generate_text(
                instruction=llm_prompt,
                context=context_message,
                parameters=llm_parameters
            )
            
            # Process response - extract ONLY the first complete JSON object
            raw_response = llm_result.get('result', '').strip()
            
            # Find the first JSON object and extract it completely
            json_start = raw_response.find('{')
            if json_start >= 0:
                # Count braces to find the complete first JSON object
                brace_count = 0
                json_end = json_start
                for i, char in enumerate(raw_response[json_start:], json_start):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            json_end = i + 1
                            break
                
                if json_end > json_start:
                    json_part = raw_response[json_start:json_end]
                    logger.info(f"Extracted first JSON object: {json_part[:100]}..." if len(json_part) > 100 else f"Extracted JSON: {json_part}")
                else:
                    # Fallback to old method if brace counting failed
                    json_part = raw_response[json_start:raw_response.rfind('}') + 1]
                    logger.warning(f"Used fallback JSON extraction: {json_part[:100]}...")
            else:
                logger.error(f"No JSON found in response: {raw_response[:200]}...")
                raise ValueError("No valid JSON structure found in LLM response")
            
            if json_part:
                
                try:
                    # Parse the JSON response from LLM
                    llm_json = json.loads(json_part)
                    
                    # Return the parsed response directly - let app handle its own format
                    llm_json["processing_time_ms"] = (time.time() - start_time) * 1000
                    llm_json["model_used"] = llm_result.get('model_used', 'unknown')
                    llm_json["app_config_used"] = app_name
                    
                    logger.info(f"Successfully parsed LLM response for '{app_name}'")
                    return llm_json
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse LLM JSON response: {e}. Applying completion...")
                    try:
                        processed_response = complete_json_structure(raw_response)
                        llm_json = json.loads(processed_response)
                        
                        # Format the completed JSON
                        formatted_response = {
                            "query_analysis": llm_json.get("query_analysis", {
                                "intent": "product_search",
                                "confidence": 0.9,
                                "detected_entities": {},
                                "requires_conversation_context": False
                            }),
                            "execution_plan": llm_json.get("execution_plan", []),
                            "fallback_response": llm_json.get("fallback_response"),
                            "expected_result_format": llm_json.get("expected_result_format", "product_list"),
                            "ui_guidance": llm_json.get("ui_guidance"),
                            "processing_time_ms": (time.time() - start_time) * 1000,
                            "model_used": llm_result.get('model_used', 'unknown'),
                            "app_config_used": app_name
                        }
                        
                        logger.info(f"JSON completion successful for {app_name}")
                        return formatted_response
                        
                    except Exception as completion_error:
                        logger.error(f"JSON completion failed: {completion_error}")
                        # Fall back to default response
                        pass
            
            # Fallback response if parsing fails
            logger.warning(f"Unable to parse LLM response as JSON for {app_name}, using fallback")
            processing_time = (time.time() - start_time) * 1000
            
            return {
                "query_analysis": {
                    "intent": "product_search",
                    "confidence": 0.7,
                    "detected_entities": {"categories": [], "price_constraints": {}},
                    "requires_conversation_context": False
                },
                "execution_plan": [{
                    "step_number": 1,
                    "step_type": "data_fetch",
                    "tool_name": "products.search",
                    "description": f"Search for: {user_query}",
                    "parameters": {"query": user_query, "limit": 10},
                    "optional": False
                }],
                "fallback_response": None,
                "expected_result_format": "product_list",
                "ui_guidance": "Display search results",
                "processing_time_ms": processing_time,
                "model_used": llm_result.get('model_used', 'unknown'),
                "app_config_used": app_name
            }
            
        except ValueError:
            # Re-raise validation errors as-is
            raise
        except Exception as e:
            logger.error(f"Failed to process app-specific reasoning for {app_name}: {e}")
            raise ValueError(f"App reasoning processing failed: {str(e)}")
    
    @staticmethod
    async def process_image_reasoning(instruction: str, image_data: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process image-based reasoning"""
        start_time = time.time()
        
        # Validate inputs
        if not instruction or not instruction.strip():
            raise ValueError("Instruction cannot be empty")
        if not image_data or not image_data.strip():
            raise ValueError("Image data cannot be empty")
        
        try:
            # Initialize vision model if needed
            if not model_manager.vision_model:
                logger.info("Loading vision model...")
                await model_manager.initialize_vision_model()
            
            logger.info(f"Processing image reasoning: {instruction[:100]}...")
            
            # Analyze image
            params = parameters or {}
            result = await model_manager.analyze_image(
                instruction=instruction,
                image_data=image_data,
                **params
            )
            
            processing_time = (time.time() - start_time) * 1000
            
            return {
                "result": result["result"],
                "processing_time_ms": processing_time,
                "model_used": result["model_used"],
                "task_type": "image_reasoning",
                "confidence": None,
                "reasoning_steps": None
            }
            
        except Exception as e:
            logger.error(f"Failed to process image reasoning: {e}")
            raise ValueError(f"Image reasoning failed: {str(e)}")

    @staticmethod
    async def process_app_image_reasoning(app_name: str, user_query: str, image_data: str, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process app-specific reasoning with image - uses SAME flow as text processing after vision analysis"""
        start_time = time.time()
        
        # Validate inputs
        if not app_name or not app_name.strip():
            raise ValueError("App name cannot be empty")
        if not user_query or not user_query.strip():
            raise ValueError("User query cannot be empty")
        if not image_data or not image_data.strip():
            raise ValueError("Image data cannot be empty")
        
        logger.info(f"Processing app image reasoning for '{app_name}': {user_query[:100]}... with image")
        
        try:
            # Step 1: Get simple image description from vision model
            logger.info("Step 1: Analyzing image content with vision model...")
            if not hasattr(model_manager, 'vision_pipeline') or model_manager.vision_pipeline is None:
                logger.info("Loading vision model...")
                await model_manager.initialize_vision_model()
            
            # Simple image analysis - just get description
            image_result = await model_manager.analyze_image(
                instruction="Describe this product briefly",
                image_data=image_data
            )
            image_description = image_result["result"]
            logger.info(f"Vision result: {image_description}")
            
            # Step 2: Combine user query with image description
            combined_query = f"{user_query}. Image shows: {image_description}"
            logger.info("Step 2: Combined query created")
            
            # Step 3: Process through NORMAL text reasoning (same as regular queries)
            logger.info("Step 3: Processing through standard text reasoning...")
            text_result = await AIService.process_app_specific_reasoning(
                app_name=app_name,
                user_query=combined_query,  # Combined query with image info
                context_data=context_data
            )
            
            # Step 4: Add image metadata to result
            processing_time = (time.time() - start_time) * 1000
            text_result["processing_time_ms"] = processing_time
            text_result["image_description"] = image_description
            text_result["model_used"] = {
                "vision": image_result.get("model_used", "vision_model"),
                "text": text_result.get("model_used", "text_model")
            }
            
            logger.info(f"Successfully processed image reasoning for '{app_name}'")
            return text_result
            
        except Exception as e:
            logger.error(f"Failed to process app image reasoning: {e}")
            
            # Fallback: return same structure as text processing fallback
            processing_time = (time.time() - start_time) * 1000
            return {
                "intent": "product_search",
                "categories": [],
                "product_items": [user_query],
                "constraints": {},
                "ui_handlers": [],
                "variants": [],
                "confidence": 0.5,
                "execution_plan": {
                    "steps": [{
                        "step_number": 1,
                        "step_type": "product_search",
                        "tool_name": "products.search"
                    }]
                },
                "processing_time_ms": processing_time,
                "model_used": "fallback",
                "app_config_used": app_name,
                "image_description": "Image analysis failed",
                "error": str(e)
            }
