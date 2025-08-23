#!/usr/bin/env python3
"""
Test mixed intent query: find electronics under 100 pounds and add to cart
"""
import requests
import json

def test_mixed_intent():
    # Test the mixed intent query
    data = {
        'app_name': 'nextshop',
        'user_query': 'find electronics under 100 pounds and add to cart',
        'available_categories': ['electronics', 'mens clothing', 'womens clothing', 'jewelery'],
        'conversation_history': [],
        'mcp_tools_context': [{'name': 'products.list', 'description': 'Search products'}],
        'ui_handlers_context': [{'name': 'cart.add', 'description': 'Add to cart'}]
    }

    try:
        print("🧪 TESTING MIXED INTENT QUERY")
        print("==============================")
        print(f"Query: {data['user_query']}")
        print()
        
        response = requests.post('http://localhost:8000/app-reason', json=data)
        
        if response.status_code == 200:
            result = response.json()
            entities = result['query_analysis']['detected_entities']
            
            print("📊 DETECTED ENTITIES:")
            print(f"  Intent: {entities.get('intent', 'N/A')}")
            print(f"  Categories: {entities.get('categories', [])}")
            print(f"  Price Constraints: {entities.get('constraints', {})}")
            print(f"  UI Handlers: {entities.get('ui_handlers', [])}")
            print()
            
            # Validation
            intent_ok = entities.get('intent') == 'product_search'
            category_ok = 'electronics' in entities.get('categories', [])
            price_constraints = entities.get('constraints', {}).get('price', {})
            price_ok = price_constraints.get('max') == 100
            ui_ok = 'cart.add' in entities.get('ui_handlers', [])
            
            print("✅ VALIDATION RESULTS:")
            print(f"  Intent is 'product_search': {'✓ PASS' if intent_ok else '✗ FAIL'}")
            print(f"  Electronics category detected: {'✓ PASS' if category_ok else '✗ FAIL'}")
            print(f"  Price constraint max=100: {'✓ PASS' if price_ok else '✗ FAIL'}")
            print(f"  UI handler 'cart.add' detected: {'✓ PASS' if ui_ok else '✗ FAIL'}")
            print()
            
            if all([intent_ok, category_ok, price_ok, ui_ok]):
                print("🎉 ALL TESTS PASSED! Mixed intent query working perfectly!")
                return True
            else:
                print("❌ Some tests failed - mixed intent detection needs investigation")
                print("\n📋 Full response for debugging:")
                print(json.dumps(result, indent=2))
                return False
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing mixed intent: {e}")
        return False

if __name__ == "__main__":
    test_mixed_intent()
