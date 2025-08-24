"""
Generic AI Reasoning Server - Entry Point
A minimal, cross-platform AI reasoning server that can be used for any purpose.
Receives instructions and context, returns AI-generated responses.
"""
import logging
import time
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.models import model_manager  # Import from models.py file
from app.core.config_manager import config_manager
from app.routes import health, reasoning, config as config_routes
from app.schemas import ErrorResponse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()


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

# Include route modules
app.include_router(health.router, tags=["Health & Info"])
app.include_router(reasoning.router, tags=["AI Reasoning"])
app.include_router(config_routes.router, tags=["Configuration"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error on {request.url}: {exc}")
    
    # Return proper JSON response instead of calling .dict() on ErrorResponse
    from fastapi.responses import JSONResponse
    
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "error_code": "INTERNAL_ERROR", 
            "timestamp": time.time(),
            "path": str(request.url)
        }
    )


if __name__ == "__main__":
    logger.info("Starting AI Reasoning Server in development mode")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
