
"""
Generic AI Reasoning Server
A minimal, cross-platform AI reasoning server that can be used for any purpose.
Receives instructions and context, returns AI-ge5. Cat4. Price: "under X"→max:X, "over X"→min:X
5. Category Rules (Dynamic):
   - Match exact category names from available list
   - For generic terms, find closest matching categories
   - Gender-neutral clothing → include both men's and women's categories
   - Broad product terms (like "products", "items") → use ALL categories
   - Unknown/unclear queries → use ALL available categories
6. Extract product keywords to product_items (shirt, jacket, etc.)es:
   - "electronics" → ["electronics"]
   - "jewelry"/"jewelery" → ["jewelery"] 
   - "men's"/"mens" clothing → ["men's clothing"]
   - "women's"/"womens" clothing → ["women's clothing"]
   - clothing without gender (shirts/jackets/jeans/t-shirt) → ["men's clothing","women's clothing"]
   - unclear queries → use all categories
6. Extract product keywords to product_items (shirt, jacket, etc.)ated responses.
"""
import asyncio
import json
import logging
import time
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import model_manager
from app.config_manager import config_manager
from app.schemas import (
    ReasoningRequest, 
    ImageReasoningRequest, 
    AppSpecificReasoningRequest,
    ReasoningResponse, 
    AppSpecificReasoningResponse,
    HealthResponse,
    ErrorResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Server start time for uptime calculation
START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Server will run on {settings.HOST}:{settings.PORT}")
    
    try:
        # Initialize config manager first
        logger.info("Initializing app configurations...")
        available_apps = config_manager.list_available_apps()
        logger.info(f"Available apps: {available_apps}")
        
        # Initialize AI models
        logger.info("Initializing AI models...")
        await model_manager.initialize_text_model()  # Auto-detect from models/ folder
        await model_manager.initialize_vision_model()  # Auto-detect vision models
        logger.info("AI models ready")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise
    finally:
        logger.info("Server shutting down")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Generic AI reasoning server for dynamic instruction-based tasks",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": ["/health", "/reason", "/reason-image", "/app-reason", "/apps"]
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - START_TIME
    model_status = model_manager.get_status()
    
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        models_loaded=model_status["loaded_models"],
        memory_usage={"gpu_memory_gb": float(model_status["memory_allocated"])} if model_status.get("memory_allocated") else None,
        uptime_seconds=uptime
    )


@app.post("/reason", response_model=ReasoningResponse)
async def reason(request: ReasoningRequest):
    """Main reasoning endpoint"""
    try:
        start_time = time.time()
        
        # Validate instruction
        if not request.instruction.strip():
            raise HTTPException(status_code=400, detail="Instruction cannot be empty")
        
        logger.info(f"Processing reasoning request: {request.instruction[:100]}...")
        
        # Generate AI response
        params = request.parameters or {}
        result = await model_manager.generate_text(
            instruction=request.instruction,
            context=request.context,
            **params
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return ReasoningResponse(
            result=result["result"],
            processing_time_ms=processing_time,
            model_used=result["model_used"],
            task_type=request.task_type,
            confidence=None,
            reasoning_steps=None
        )
        
    except Exception as e:
        logger.error(f"Reasoning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/app-reason", response_model=AppSpecificReasoningResponse)
async def app_specific_reasoning(request: AppSpecificReasoningRequest):
    """Simple LLM analysis - NO execution planning (that's for LangChain backend)"""
    try:
        start_time = time.time()
        
        logger.info(f"Processing LLM analysis for {request.app_name}: {request.user_query[:100]}...")
        
        # Comprehensive prompt that achieved 93.3% category detection accuracy
        llm_analysis_prompt = f"""NextShop ecommerce assistant. Analyze query and return JSON only.

Query: "{request.user_query}"
Categories: {request.available_categories}

Rules:
1. Intent: "product_search" (find products), "ui_handling_action" (cart/auth), "general_chat" (help)
2. MIXED queries (find X + add to cart) = intent:"product_search" + ui_handlers:["cart.add"]
3. UI Detection: "add to cart"→["cart.add"], "remove from cart"→["cart.remove"], "login"→["auth.login"]
4. Price: "under X"→max:X, "over X"→min:X. Rating only if asked.
5. Category Rules:
   - always infer closest matching categories even gender wise , do not miss quotations, return exact string as it is.
6. Extract and infer only real product item keywords to product_items, not category names.
7. Infer variants if any like color, size etc.
Expected JSON Output Format:
{{"intent":"product_search","categories":["category1","category2"],"product_items":["item1","item2"],"constraints":{{"price":{{"min":100}},"rating":4}},"ui_handlers":["cart.add"],"variants":["red","large"],"confidence":0.9}}

Examples:
- "find electronics under 100 and add to cart" → {{"intent":"product_search","categories":["electronics"],"product_items":[],"constraints":{{"price":{{"max":100}}}},"ui_handlers":["cart.add"],"variants":[],"confidence":0.9}}
- "help with returns" → {{"intent":"general_chat","categories":[],"product_items":[],"constraints":{{}},"ui_handlers":[],"variants":[],"message":"Contact customer service for returns.","confidence":0.9}}

Return JSON:"""        
        # Get simple LLM analysis
        print(f"🔍 [AI Server] Sending prompt to LLM: {llm_analysis_prompt}")
        
        llm_result = await model_manager.generate_text(
            instruction=llm_analysis_prompt,
            context="JSON formatter - output only JSON",
            parameters={"max_tokens": 300, "temperature": 0.1}  # Balanced for 512 context window
        )
        
        print(f"📥 [AI Server] Raw LLM result: {llm_result}")
        llm_response = llm_result.get('result', '').strip()
        print(f"🧹 [AI Server] Cleaned LLM response: '{llm_response}'")
        
        if not llm_response:
            print(f"❌ [AI Server] LLM returned empty response!")
            raise ValueError("LLM returned empty response")
        
        # Parse ONLY the FIRST JSON object to prevent multiple responses
        try:
            json_start = llm_response.find('{')
            if json_start == -1:
                print(f"❌ [AI Server] No JSON found in response: '{llm_response}'")
                raise ValueError("No JSON object found")
            
            # Extract ONLY the first complete JSON object
            brace_count = 0
            json_end = json_start
            for i, char in enumerate(llm_response[json_start:], start=json_start):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break
            
            if brace_count == 0:
                # Found complete FIRST JSON - ignore everything after
                first_json = llm_response[json_start:json_end]
                print(f"🔧 [AI Server] FIRST JSON extracted: '{first_json}'")
                llm_data = json.loads(first_json)
                
                # Validate essential fields
                if 'intent' not in llm_data:
                    llm_data['intent'] = 'product_search'
                if 'confidence' not in llm_data:
                    llm_data['confidence'] = 0.9
                if 'categories' not in llm_data:
                    llm_data['categories'] = request.available_categories
                if 'product_items' not in llm_data:
                    llm_data['product_items'] = []
                if 'ui_handlers' not in llm_data:
                    llm_data['ui_handlers'] = []
                if 'constraints' not in llm_data:
                    llm_data['constraints'] = {}
                    
                print(f"✅ [AI Server] Validated JSON: {llm_data}")
            else:
                print(f"⚠️ [AI Server] Incomplete JSON, attempting completion...")
                truncated_json = llm_response[json_start:]
                
                # Smart completion - handle incomplete key-value pairs
                completed_json = truncated_json.rstrip()
                
                # Handle incomplete string keys (like `"ui` instead of `"ui_handlers"`)
                if completed_json.endswith('"ui'):
                    completed_json = completed_json[:-3] + '"ui_handlers":[]'
                elif completed_json.endswith('"var'):
                    completed_json = completed_json[:-4] + '"variants":[]'
                elif completed_json.endswith('"con'):
                    completed_json = completed_json[:-4] + '"confidence":0.9'
                # Handle incomplete key-value pairs
                elif completed_json.endswith('"rating":'):
                    completed_json += '4'
                elif completed_json.endswith('"price":'):
                    completed_json += '{}'
                elif completed_json.endswith(':'):
                    completed_json += 'null'
                elif completed_json.endswith(','):
                    completed_json = completed_json[:-1]  # Remove trailing comma
                
                # Count braces to close properly
                open_braces = completed_json.count('{') - completed_json.count('}')
                while open_braces > 0:
                    completed_json += '}'
                    open_braces -= 1
                    
                print(f"🔧 [AI Server] Attempting to parse: '{completed_json}'")
                llm_data = json.loads(completed_json)
                
                # Ensure essential fields are present for completed JSON too
                if 'confidence' not in llm_data:
                    llm_data['confidence'] = 0.9
                if 'intent' not in llm_data:
                    llm_data['intent'] = 'product_search'
                if 'ui_handlers' not in llm_data:
                    llm_data['ui_handlers'] = []
                if 'variants' not in llm_data:
                    llm_data['variants'] = []
                    
                print(f"✅ [AI Server] Completed JSON successfully: {llm_data}")
            
        except json.JSONDecodeError as e:
            print(f"❌ [AI Server] JSON decode error: {e}")
            print(f"❌ [AI Server] Problematic response: '{llm_response}'")
            raise ValueError(f"LLM response is not valid JSON: {e}")
        except Exception as e:
            print(f"❌ [AI Server] Unexpected parsing error: {e}")
            print(f"❌ [AI Server] Response: '{llm_response}'")
            raise ValueError(f"Failed to parse LLM response: {e}")
        
        processing_time = (time.time() - start_time) * 1000
        
        # Return ONLY LLM analysis - let LangChain backend handle execution planning
        return AppSpecificReasoningResponse(
            query_analysis={
                "intent": llm_data.get('intent', 'product_search'),
                "confidence": llm_data.get('confidence', 0.9),
                "detected_entities": llm_data,
                "requires_conversation_context": False
            },
            execution_plan=[],  # NO execution planning - that's for LangChain
            fallback_response=llm_data.get('message', None),  # Direct message for general chat
            expected_result_format="llm_analysis_only",
            ui_guidance=None,
            processing_time_ms=processing_time,
            model_used=llm_result.get('model_used', 'qwen2.5-3b-instruct'),
            app_config_used=request.app_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")


@app.post("/reason-image", response_model=ReasoningResponse)
async def reason_image(request: ImageReasoningRequest):
    """Image-based reasoning endpoint"""
    try:
        start_time = time.time()
        
        # Initialize vision model if not loaded
        if not model_manager.vision_model:
            logger.info("Loading vision model...")
            await model_manager.initialize_vision_model()
        
        logger.info(f"Processing image reasoning: {request.instruction[:100]}...")
        
        # Analyze image
        params = request.parameters or {}
        result = await model_manager.analyze_image(
            instruction=request.instruction,
            image_data=request.image_data,
            **params
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return ReasoningResponse(
            result=result["result"],
            processing_time_ms=processing_time,
            model_used=result["model_used"],
            task_type="image_reasoning",
            confidence=None,
            reasoning_steps=None
        )
        
    except Exception as e:
        logger.error(f"Image reasoning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}")
    return ErrorResponse(
        error=str(exc),
        error_code="INTERNAL_ERROR",
        timestamp=time.time()
    ).dict()


@app.get("/apps")
async def list_apps():
    """List available app configurations"""
    return {
        "available_apps": config_manager.list_available_apps(),
        "total_apps": len(config_manager.list_available_apps())
    }


@app.get("/apps/{app_name}/config")
async def get_app_config(app_name: str):
    """Get configuration for a specific app"""
    config = config_manager.get_app_config(app_name)
    if not config:
        raise HTTPException(status_code=404, detail=f"App {app_name} not found")
    
    return config.dict()


if __name__ == "__main__":
    logger.info("Starting AI Reasoning Server in development mode")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
