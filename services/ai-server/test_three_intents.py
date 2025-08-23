#!/usr/bin/env python3
"""
Test the 3 different intent types with the updated prompt examples
"""
import requests
import json

def test_three_intents():
    print("🧪 TESTING THREE INTENT TYPES")
    print("==============================")
    
    test_cases = [
        {
            "query": "find mobile phones under 500",
            "expected_intent": "product_search",
            "expected_categories": ["electronics"],
            "expected_product_items": ["mobile phone"],
            "expected_ui_handlers": [],
            "description": "Product search with price constraint"
        },
        {
            "query": "add to cart",
            "expected_intent": "ui_handling_action", 
            "expected_categories": [],
            "expected_product_items": [],
            "expected_ui_handlers": ["cart.add"],
            "description": "Pure UI action"
        },
        {
            "query": "what is your return policy?",
            "expected_intent": "general_chat",
            "expected_categories": [],
            "expected_product_items": [],
            "expected_ui_handlers": [],
            "description": "General chat/help"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: '{test['query']}'")
        print(f"   Description: {test['description']}")
        
        data = {
            'app_name': 'nextshop',
            'user_query': test['query'],
            'available_categories': ['electronics', 'men\'s clothing', 'women\'s clothing', 'jewelery'],
            'conversation_history': [],
            'mcp_tools_context': [{'name': 'products.list', 'description': 'Search products'}],
            'ui_handlers_context': [{'name': 'cart.add', 'description': 'Add to cart'}]
        }
        
        try:
            response = requests.post('http://localhost:8000/app-reason', json=data)
            
            if response.status_code == 200:
                result = response.json()
                entities = result['query_analysis']['detected_entities']
                
                intent = entities.get('intent', 'N/A')
                categories = entities.get('categories', [])
                product_items = entities.get('product_items', [])
                ui_handlers = entities.get('ui_handlers', [])
                message = entities.get('message')
                
                print(f"   Intent: {intent} (expected: {test['expected_intent']})")
                print(f"   Categories: {categories} (expected: {test['expected_categories']})")
                print(f"   Product Items: {product_items} (expected: {test['expected_product_items']})")
                print(f"   UI Handlers: {ui_handlers} (expected: {test['expected_ui_handlers']})")
                if message:
                    print(f"   Message: {message}")
                
                # Validate results
                intent_ok = intent == test['expected_intent']
                categories_ok = set(categories) >= set(test['expected_categories'])
                items_ok = set(product_items) >= set(test['expected_product_items'])
                ui_ok = set(ui_handlers) >= set(test['expected_ui_handlers'])
                
                if intent_ok and categories_ok and items_ok and ui_ok:
                    print(f"   Result: ✅ PASS")
                else:
                    print(f"   Result: ❌ FAIL")
                    if not intent_ok: print(f"      Intent mismatch")
                    if not categories_ok: print(f"      Categories missing: {set(test['expected_categories']) - set(categories)}")
                    if not items_ok: print(f"      Product items missing: {set(test['expected_product_items']) - set(product_items)}")
                    if not ui_ok: print(f"      UI handlers missing: {set(test['expected_ui_handlers']) - set(ui_handlers)}")
            else:
                print(f"   Result: ❌ ERROR - {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"   Result: ❌ EXCEPTION - {e}")

if __name__ == "__main__":
    test_three_intents()
