#!/usr/bin/env python3
"""Quick server test."""

import asyncio
import sys
import os

# Change to the correct directory
os.chdir(r'c:\Users\razal\OneDrive\Documents\My_Projects\NextShop-E-commerce-App-with-AI-Assistant\services\ai-server')

# Add to path
sys.path.insert(0, os.getcwd())

async def test_server():
    """Test that everything loads correctly."""
    try:
        from app.models import model_manager
        from app.main import app
        
        print("✅ All imports successful")
        
        # Initialize text model 
        await model_manager.initialize_text_model()
        print("🤖 Mock text model initialized")
        
        status = model_manager.get_status()
        print(f"📊 Status: {status}")
        
        if status['text_model_ready']:
            print("🚀 Server is ready to handle requests!")
            print("   You can now start the server with:")
            print("   uvicorn app.main:app --host 127.0.0.1 --port 8000")
        else:
            print("⚠️  Text model not ready")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_server())
