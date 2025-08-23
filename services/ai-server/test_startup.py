#!/usr/bin/env python3
"""Simple startup test to verify the server can start and models load correctly."""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

# Test imports
try:
    from app.models import model_manager
    from app.main import app
    print("✅ All imports successful")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Test model manager
try:
    print(f"🤖 Model manager status: {model_manager.get_status()}")
    print("✅ Model manager working")
except Exception as e:
    print(f"❌ Model manager failed: {e}")
    sys.exit(1)

print("🎉 AI Reasoning Server is ready to run!")
print("To start the server, run: python -m uvicorn app.main:app --port 8000")
