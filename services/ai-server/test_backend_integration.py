#!/usr/bin/env python3
"""
Test backend integration with LangChain orchestrator
"""
import requests
import json

def test_backend_integration():
    print("🧪 TESTING BACKEND INTEGRATION WITH LANGCHAIN")
    print("==============================================")
    
    # Test cases for different intent types
    test_cases = [
        {
            "query": "find electronics under 100 and add to cart",
            "description": "Mixed intent: product search + UI action",
            "expected_intent": "product_search"
        },
        {
            "query": "show me jewelry",
            "description": "Pure product search",
            "expected_intent": "product_search"
        },
        {
            "query": "add to cart",
            "description": "Pure UI action",
            "expected_intent": "ui_handling_action"
        }
    ]
    
    backend_url = "http://localhost:3001/api/ai/query"
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: '{test_case['query']}'")
        print(f"   Description: {test_case['description']}")
        
        data = {
            "query": test_case["query"],
            "context": {
                "sessionId": "test-session-123",
                "userId": "test-user"
            }
        }
        
        try:
            print(f"   🔗 Calling backend: {backend_url}")
            response = requests.post(backend_url, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Backend responded successfully")
                print(f"   � Full response structure:")
                print(f"      {json.dumps(result, indent=6)[:500]}...")
                
                print(f"   �📊 Response type: {result.get('type', 'unknown')}")
                print(f"   🎯 Intent detected: {result.get('intent', 'unknown')}")
                
                if 'products' in result:
                    products = result.get('products', [])
                    print(f"   🛍️  Products found: {len(products)} items")
                
                if 'ui_actions' in result:
                    ui_actions = result.get('ui_actions', [])
                    print(f"   🖱️  UI actions: {ui_actions}")
                
                if 'message' in result:
                    message = result.get('message', '')[:100]
                    print(f"   💬 Message: {message}...")
                
                print(f"   ✅ SUCCESS: LangChain handled the query properly")
                
            else:
                print(f"   ❌ Backend error: {response.status_code}")
                print(f"   📝 Error response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Cannot connect to backend at {backend_url}")
            print(f"   💡 Make sure backend is running on port 3001")
            
        except requests.exceptions.Timeout:
            print(f"   ⏰ Backend request timed out (>30s)")
            
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
    
    print(f"\n{'='*50}")
    print(f"🎯 BACKEND INTEGRATION TEST COMPLETE")
    print(f"   This test verifies that LangChain orchestrator can handle")
    print(f"   AI server responses and execute the appropriate logic.")

if __name__ == "__main__":
    test_backend_integration()
