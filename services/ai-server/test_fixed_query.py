#!/usr/bin/env python3

import requests
import json

print('🧪 TESTING FIXED AI SERVER')
print('=' * 40)

# Test the problematic query
test_query = 'find products under 100 pounds and add to cart'

try:
    response = requests.post('http://localhost:8000/app-reason', json={
        'app_name': 'nextshop',
        'user_query': test_query,
        'available_categories': ['electronics', "men's clothing", "women's clothing", 'jewelery'],
        'conversation_history': [],
        'mcp_tools_context': [{'name': 'products.list', 'description': 'Search products'}],
        'ui_handlers_context': []
    })

    if response.status_code == 200:
        result = response.json()
        entities = result['query_analysis']['detected_entities']
        
        print(f'Query: "{test_query}"')
        print(f'Intent: {entities.get("intent")}')
        print(f'Categories: {entities.get("categories")}')
        print(f'Product Items: {entities.get("product_items")}')
        print(f'Constraints: {entities.get("constraints")}')
        print(f'UI Handlers: {entities.get("ui_handlers")}')
        print(f'Confidence: {entities.get("confidence")}')
        
        # Check if analysis is correct
        expected_all_categories = ['electronics', "men's clothing", "women's clothing", 'jewelery']
        expected_constraints = {'max': 100}
        expected_ui_handlers = ['cart.add']
        
        print('\nExpected vs Actual:')
        print(f'Categories: {expected_all_categories} vs {entities.get("categories")}')
        print(f'Constraints: {expected_constraints} vs {entities.get("constraints")}')
        print(f'UI Handlers: {expected_ui_handlers} vs {entities.get("ui_handlers")}')
        print(f'Product Items: [] vs {entities.get("product_items")}')
        
        if (set(entities.get('categories', [])) == set(expected_all_categories) and
            entities.get('constraints') == expected_constraints and
            entities.get('ui_handlers') == expected_ui_handlers and
            entities.get('product_items') == []):
            print('\n✅ ANALYSIS CORRECT!')
        else:
            print('\n❌ ANALYSIS STILL INCORRECT')
    else:
        print(f'❌ API Error: {response.status_code}')
        print(response.text)
        
except Exception as e:
    print(f'❌ Exception: {e}')
