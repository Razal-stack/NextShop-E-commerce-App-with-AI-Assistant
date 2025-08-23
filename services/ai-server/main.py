
"""
Generic AI Reasoning Server
A minimal, cross-platform AI reasoning server that can be used for any purpose.
Receives instructions and context, returns AI-generated reasoning.
"""
import asyncio
import logging
import time
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import model_manager
from app.schemas import (
    ReasoningRequest, 
    ImageReasoningRequest, 
    ReasoningResponse, 
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
        "endpoints": ["/health", "/reason", "/reason-image"]
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


if __name__ == "__main__":
    logger.info("Starting AI Reasoning Server in development mode")
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
