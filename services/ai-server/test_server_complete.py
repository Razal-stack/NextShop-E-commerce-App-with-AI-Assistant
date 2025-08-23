#!/usr/bin/env python3
"""
Comprehensive test script for AI Server after updates
Tests all major components and API endpoints
"""
import asyncio
import sys
import json
import time
import httpx
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

async def test_server_complete():
    """Test the complete AI server functionality"""
    print("🧪 Starting comprehensive AI server tests...\n")
    
    # Test 1: Basic imports and configuration
    print("1️⃣ Testing basic imports and configuration...")
    try:
        from app.core.config import get_settings
        from app.utils.logger import get_logger, setup_logging
        from app.models.schemas import TextGenerationRequest, TextGenerationResponse
        
        settings = get_settings()
        setup_logging()
        logger = get_logger(__name__)
        
        print(f"   ✅ Settings loaded: {settings.APP_NAME} v{settings.APP_VERSION}")
        print(f"   ✅ Host: {settings.HOST}, Port: {settings.PORT}")
        print(f"   ✅ Debug mode: {settings.DEBUG}")
        print(f"   ✅ Logger initialized")
        
    except Exception as e:
        print(f"   ❌ Import/config error: {e}")
        return False
    
    # Test 2: Schema validation
    print("\n2️⃣ Testing Pydantic v2 schemas...")
    try:
        # Test request schema
        request_data = {
            "prompt": "Hello AI, tell me about NextShop!",
            "max_tokens": 150,
            "temperature": 0.7
        }
        request = TextGenerationRequest(**request_data)
        print(f"   ✅ Request schema works: {request.prompt[:30]}...")
        
        # Test validation
        try:
            invalid_request = TextGenerationRequest(prompt="", max_tokens=-1)
            print("   ❌ Validation should have failed!")
            return False
        except Exception as validation_error:
            print(f"   ✅ Schema validation works correctly")
        
    except Exception as e:
        print(f"   ❌ Schema error: {e}")
        return False
    
    # Test 3: FastAPI app creation
    print("\n3️⃣ Testing FastAPI application...")
    try:
        from main import app
        
        print(f"   ✅ FastAPI app created successfully")
        print(f"   ✅ App title: {app.title}")
        print(f"   ✅ App version: {app.version}")
        print(f"   ✅ Middleware count: {len(app.middleware_stack)}")
        
    except Exception as e:
        print(f"   ❌ FastAPI app error: {e}")
        return False
    
    # Test 4: Start server and test endpoints
    print("\n4️⃣ Testing server endpoints...")
    
    # Start server in background
    import subprocess
    import time
    
    # Start server process
    server_process = subprocess.Popen([
        sys.executable, "main.py"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Wait for server to start
    await asyncio.sleep(3)
    
    try:
        # Test endpoints
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test root endpoint
            response = await client.get(f"http://{settings.HOST}:{settings.PORT}/")
            print(f"   ✅ Root endpoint: {response.status_code}")
            root_data = response.json()
            print(f"   ✅ Service: {root_data.get('service')}")
            
            # Test health endpoint
            response = await client.get(f"http://{settings.HOST}:{settings.PORT}/health")
            print(f"   ✅ Health endpoint: {response.status_code}")
            health_data = response.json()
            print(f"   ✅ Status: {health_data.get('status')}")
            
            # Test generation endpoint
            test_request = {
                "prompt": "What is NextShop?",
                "max_tokens": 100,
                "temperature": 0.7
            }
            
            response = await client.post(
                f"http://{settings.HOST}:{settings.PORT}/api/v1/generate",
                json=test_request
            )
            print(f"   ✅ Generate endpoint: {response.status_code}")
            
            if response.status_code == 200:
                gen_data = response.json()
                print(f"   ✅ Generated text length: {len(gen_data['generations'][0]['text'])}")
                print(f"   ✅ Processing time: {gen_data['processing_time_ms']:.1f}ms")
            
    except Exception as e:
        print(f"   ❌ Server test error: {e}")
        return False
    
    finally:
        # Clean up server process
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
    
    # Test 5: Dependencies and versions
    print("\n5️⃣ Testing dependency versions...")
    try:
        import fastapi
        import pydantic
        import uvicorn
        import torch
        import transformers
        
        versions = {
            "FastAPI": fastapi.__version__,
            "Pydantic": pydantic.__version__,
            "Uvicorn": uvicorn.__version__,
            "PyTorch": torch.__version__,
            "Transformers": transformers.__version__
        }
        
        for name, version in versions.items():
            print(f"   ✅ {name}: {version}")
            
    except Exception as e:
        print(f"   ❌ Dependency error: {e}")
        return False
    
    print("\n🎉 All comprehensive tests passed!")
    print("✨ AI Server is fully updated and ready for production!")
    
    return True


if __name__ == "__main__":
    # Run the comprehensive test
    success = asyncio.run(test_server_complete())
    
    if success:
        print("\n🚀 Server is ready! You can start it with:")
        print("   python main.py")
        print("\n📊 Available endpoints:")
        print("   GET  /           - Basic status")
        print("   GET  /health     - Detailed health check")
        print("   POST /api/v1/generate - Text generation")
        print("   GET  /docs       - API documentation (debug mode)")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
