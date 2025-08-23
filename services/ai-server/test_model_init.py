"""
Test model initialization directly
"""
import asyncio
import sys
import os
sys.path.append('.')

from app.models import model_manager

async def test_model_init():
    print('🧠 Testing model initialization...')
    
    # Check available models
    print(f"📋 Available models: {model_manager.available_models}")
    
    # Try to initialize text model
    try:
        print("🔄 Initializing text model...")
        await model_manager.initialize_text_model()
        print("✅ Text model initialized successfully!")
        
        # Check status
        status = model_manager.get_status()
        print(f"📊 Model status: {status}")
        
        # Test generation
        print("🧪 Testing text generation...")
        result = await model_manager.generate_text(
            instruction='Return JSON: {"test": "working"}',
            parameters={'max_tokens': 50, 'temperature': 0.0}
        )
        print(f"📥 Generation result: {result}")
        
    except Exception as e:
        print(f"❌ Model initialization failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_model_init())
