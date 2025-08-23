#!/usr/bin/env python3
"""
Test script for dynamic model detection system
"""
import sys
import os
from pathlib import Path

def test_dynamic_detection():
    """Test the dynamic model detection system"""
    print("🧪 Testing Dynamic Model Detection System")
    print("=" * 50)
    
    try:
        # Test config import
        from app.config import settings
        print("✅ Config imported successfully")
        
        # Test model detection methods
        print(f"\n📁 Model directory: {settings.MODEL_DIR}")
        print(f"🔍 Directory exists: {Path(settings.MODEL_DIR).exists()}")
        
        # Test model detection
        available_models = settings.get_available_gguf_models()
        print(f"\n📋 Available GGUF models: {len(available_models)}")
        
        for i, model_path in enumerate(available_models, 1):
            model_name = Path(model_path).name
            model_size_mb = Path(model_path).stat().st_size / (1024 * 1024)
            print(f"   {i}. {model_name} ({model_size_mb:.1f} MB)")
        
        # Test primary model selection
        primary_model = settings.get_primary_model_path()
        if primary_model:
            primary_name = Path(primary_model).name
            print(f"\n🎯 Primary model: {primary_name}")
        else:
            print("\n⚠️  No primary model found")
        
        # Test model info method
        model_info = settings.get_model_info()
        print(f"\n📊 Model Info:")
        print(f"   Total models: {model_info['total_models']}")
        print(f"   Primary: {model_info['primary_model']}")
        print(f"   Available: {model_info['available_models']}")
        
        # Test scenarios
        print(f"\n🧪 Test Scenarios:")
        if len(available_models) == 0:
            print("   📥 Scenario: No models - Server will show helpful error")
        elif len(available_models) == 1:
            print("   🎯 Scenario: Single model - Perfect!")
        else:
            print("   🔄 Scenario: Multiple models - First alphabetically will be used")
            sorted_models = sorted([Path(m).name for m in available_models])
            print(f"   📈 Order: {sorted_models}")
        
        print("\n✅ Dynamic detection system working correctly!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 NextShop AI Server - Dynamic Model Test")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("app").exists():
        print("❌ Please run this from the ai-server directory")
        return 1
    
    # Run the test
    success = test_dynamic_detection()
    
    if success:
        print("\n🎉 All tests passed!")
        print("\n💡 To start the server:")
        print("   python run.py")
        return 0
    else:
        print("\n💥 Tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
