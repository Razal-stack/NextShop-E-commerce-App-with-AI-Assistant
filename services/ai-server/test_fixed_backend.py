#!/usr/bin/env python3

import requests
import json

def test_backend_integration():
    """Test backend integration with fixed logic"""
    
    print("🧪 TESTING BACKEND INTEGRATION WITH FIXES")
    print("=" * 50)
    
    # Test cases that should work now
    test_cases = [
        {
            'query': 'find products under 100 pounds and add to cart',
            'expected_behavior': 'All categories, price constraint max:100, ui_handlers:["cart.add"]'
        },
        {
            'query': 'show me electronics under 50',
            'expected_behavior': 'Electronics category only, price constraint max:50'
        },
        {
            'query': 'find mobile phones',
            'expected_behavior': 'Electronics category, product search for "mobile phone"'
        }
    ]
    
    # Test with backend API
    backend_url = "http://localhost:3001/api/ai/query"
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n🎯 Test {i}: {test['query']}")
        print(f"Expected: {test['expected_behavior']}")
        
        try:
            response = requests.post(backend_url, 
                json={'query': test['query']}, 
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: {response.status_code}")
                print(f"📊 Intent: {result.get('intent', 'unknown')}")
                print(f"📦 Products Found: {result.get('data', {}).get('totalFound', 0)}")
                print(f"🏷️ Applied Filters: {json.dumps(result.get('data', {}).get('appliedFilters', {}), indent=2)}")
                print(f"💬 Message: {result.get('message', 'No message')}")
                
                # Check if we got products (for under 100 pounds we should get some)
                if 'under 100' in test['query'].lower():
                    total = result.get('data', {}).get('totalFound', 0)
                    if total > 0:
                        print(f"🎉 SUCCESS: Found {total} products under £100")
                    else:
                        print(f"❌ FAIL: Expected products under £100, got {total}")
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
        except Exception as e:
            print(f"❌ Error: {e}")
            
        print("-" * 30)

if __name__ == "__main__":
    test_backend_integration()
