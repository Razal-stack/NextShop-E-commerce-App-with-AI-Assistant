#!/usr/bin/env python3
"""Test script to debug import issues"""

print("Starting import test...")

try:
    print("1. Testing basic imports...")
    import torch
    print("   ✅ torch imported successfully")
    
    from transformers import pipeline
    print("   ✅ transformers.pipeline imported successfully")
    
    from transformers import BlipProcessor, BlipForConditionalGeneration
    print("   ✅ BLIP imports successful")
    
    print("2. Testing app.models import...")
    import app.models
    print("   ✅ app.models imported")
    print(f"   📋 Available attributes: {[attr for attr in dir(app.models) if not attr.startswith('_')]}")
    
    print("3. Testing model_loader import...")
    from app.models import model_loader
    print("   ✅ model_loader imported successfully")
    print(f"   📋 ModelLoader device: {model_loader.device}")
    
except Exception as e:
    print(f"❌ Error occurred: {e}")
    import traceback
    traceback.print_exc()

print("Import test completed.")
