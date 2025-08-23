"""
Basic test to verify the AI server configuration and dependencies.
"""
import sys
from pathlib import Path

# Add the current directory to the path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all basic imports work"""
    print("Testing imports...")
    
    # Core imports
    from app.core.config import get_settings
    print("✅ Config import successful")
    
    # Settings instantiation
    settings = get_settings()
    print(f"✅ Settings loaded: {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Logger imports
    from app.utils.logger import get_logger, setup_logging
    setup_logging()
    logger = get_logger(__name__)
    print("✅ Logger setup successful")
    
    # Schema imports
    from app.models.schemas import TextGenerationRequest, TextGenerationResponse
    print("✅ Schema imports successful")
    
    # Test schema creation
    request = TextGenerationRequest(
        prompt="Test prompt",
        max_tokens=100,
        temperature=0.7
    )
    print(f"✅ Schema validation works: prompt='{request.prompt}', tokens={request.max_tokens}")
    
    return True

def test_basic_fastapi():
    """Test basic FastAPI app creation without complex services"""
    print("\nTesting basic FastAPI app...")
    
    from fastapi import FastAPI
    from app.core.config import get_settings
    
    settings = get_settings()
    
    # Create simple app
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Basic AI Server Test"
    )
    
    @app.get("/")
    async def root():
        return {"message": "AI Server is running", "version": settings.APP_VERSION}
    
    print("✅ Basic FastAPI app creation successful")
    return app

if __name__ == "__main__":
    print("🧪 Running basic AI server tests...\n")
    
    try:
        # Test imports
        test_imports()
        
        # Test basic FastAPI
        app = test_basic_fastapi()
        
        print("\n🎉 All basic tests passed!")
        print(f"✅ Python version: {sys.version}")
        print(f"✅ FastAPI app: {app.title} v{app.version}")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
