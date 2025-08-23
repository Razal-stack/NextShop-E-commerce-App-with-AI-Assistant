#!/usr/bin/env python3
"""Test script to debug import issues and show model detection"""

print("Starting import test...")

try:
    print("1. Testing basic imports...")
    import torch
    print("   ✅ torch imported successfully")
    
    from transformers import pipeline
    print("   ✅ transformers.pipeline imported successfully")
    
    from transformers import BlipProcessor, BlipForConditionalGeneration
    print("   ✅ BLIP imports successful")
    
    print("2. Testing app.config import...")
    from app.config import settings
    print("   ✅ settings imported")
    
    print("3. Testing model detection...")
    model_info = settings.get_model_info()
    print(f"   📁 Models directory: {model_info['models_directory']}")
    print(f"   📋 Available models: {model_info['available_models']}")
    print(f"   🎯 Primary model: {model_info['primary_model']}")
    print(f"   📊 Total models: {model_info['total_models']}")
    
    if model_info['primary_model']:
        print("   ✅ Model detection working!")
    else:
        print("   ⚠️  No GGUF models found - download needed")
    
    print("4. Testing model_loader import...")
    from app.models import model_loader
    print("   ✅ model_loader imported successfully")
    print(f"   �️  Device: {model_loader.device}")
    
except Exception as e:
    print(f"❌ Error occurred: {e}")
    import traceback
    traceback.print_exc()

print("Import test completed.")
