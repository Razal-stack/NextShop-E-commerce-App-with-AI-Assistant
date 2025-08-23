#!/usr/bin/env python3
"""
Test script for the new App-Specific AI Reasoning Server
Demonstrates NextShop integration with execution planning
"""

import requests
import json

def test_nextshop_reasoning():
    """Test NextShop-specific reasoning"""
    
    # Test app configuration endpoint
    print("🔧 Testing App Configuration...")
    apps_response = requests.get("http://127.0.0.1:8000/apps")
    print(f"Available apps: {apps_response.json()}")
    
    config_response = requests.get("http://127.0.0.1:8000/apps/nextshop/config")
    print(f"NextShop config loaded: ✅")
    
    # Test case 1: Product search with price filter
    print("\n🛍️ Test Case 1: Men's jackets under £50")
    
    test_request = {
        "app_name": "nextshop",
        "user_query": "Can you find me men's jackets under 50 pounds?",
        "available_categories": [
            "men's clothing",
            "women's clothing", 
            "electronics",
            "jewelery"
        ],
        "conversation_history": [],
        "current_filters": {}
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/app-reason",
        json=test_request,
        timeout=30
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Query Analysis:")
        print(json.dumps(result["query_analysis"], indent=2))
        
        print("\n📋 Execution Plan:")
        for step in result["execution_plan"]:
            print(f"  Step {step['step_number']}: {step['step_type']} - {step['tool_name']}")
            print(f"    Description: {step['description']}")
            print(f"    Parameters: {json.dumps(step['parameters'], indent=4)}")
            if step['depends_on']:
                print(f"    Depends on steps: {step['depends_on']}")
            print()
            
        if result["ui_guidance"]:
            print(f"💡 UI Guidance: {result['ui_guidance']}")
            
        print(f"⚡ Processing time: {result['processing_time_ms']:.1f}ms")
        
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
    
    # Test case 2: Out of scope query
    print("\n🚫 Test Case 2: Out of scope query")
    
    out_of_scope_request = {
        "app_name": "nextshop",
        "user_query": "What's the weather like today?",
        "conversation_history": []
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/app-reason",
        json=out_of_scope_request
    )
    
    if response.status_code == 200:
        result = response.json()
        if result["fallback_response"]:
            print(f"✅ Fallback response: {result['fallback_response']}")
        else:
            print("❌ Expected fallback response but got execution plan")
    
    # Test case 3: Complex query with variants
    print("\n👕 Test Case 3: Red t-shirts with size filtering")
    
    variant_request = {
        "app_name": "nextshop", 
        "user_query": "I'm looking for red t-shirts in size medium",
        "conversation_history": [
            {"role": "user", "content": "I was looking at shirts earlier"},
            {"role": "assistant", "content": "I can help you find shirts. What specific type are you interested in?"}
        ]
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/app-reason",
        json=variant_request
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Variant Query Analysis:")
        print(f"  Intent: {result['query_analysis']['intent']}")
        print(f"  Entities: {json.dumps(result['query_analysis']['detected_entities'], indent=2)}")
        
        print("\n📋 Execution Steps:")
        for step in result["execution_plan"]:
            print(f"  {step['step_number']}. {step['description']}")
            if 'variants' in step['tool_name']:
                print(f"     → Will search for variants after finding base products")


def test_health_and_basic():
    """Test basic functionality"""
    print("🏥 Testing Health Check...")
    health = requests.get("http://127.0.0.1:8000/health")
    print(f"Health Status: {health.json()['status']}")
    
    print("\n🧠 Testing Basic Reasoning...")
    basic_request = {
        "instruction": "Explain why someone might prefer organic cotton clothing",
        "context": "E-commerce product description context"
    }
    
    response = requests.post("http://127.0.0.1:8000/reason", json=basic_request)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Basic reasoning works: {result['result'][:100]}...")


if __name__ == "__main__":
    print("🚀 Testing NextShop AI Reasoning Server")
    print("=" * 50)
    
    try:
        # Basic tests first
        test_health_and_basic()
        
        print("\n" + "=" * 50)
        
        # Advanced app-specific tests
        test_nextshop_reasoning()
        
        print("\n🎉 All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on port 8000")
    except Exception as e:
        print(f"❌ Test failed: {e}")
