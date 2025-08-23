#!/usr/bin/env python3
"""
Quick test for improved prompt - checking category vs product_items separation
"""
import requests
import json

def test_category_separation():
    print("🧪 TESTING CATEGORY VS PRODUCT_ITEMS SEPARATION")
    print("===============================================")
    
    test_cases = [
        'find mobile phones under 500',
        'show me electronics', 
        'jackets',
        'jewelry',
        'earrings',
        'laptops',
        'suits'
    ]

    for query in test_cases:
        data = {
            'app_name': 'nextshop',
            'user_query': query,
            'available_categories': ['electronics', "men's clothing", "women's clothing", 'jewelery'],
            'conversation_history': [],
            'mcp_tools_context': [],
            'ui_handlers_context': []
        }
        
        try:
            response = requests.post('http://localhost:8000/app-reason', json=data)
            if response.status_code == 200:
                result = response.json()['query_analysis']['detected_entities']
                categories = result.get('categories', [])
                product_items = result.get('product_items', [])
                
                print(f'Query: "{query}"')
                print(f'  Categories: {categories}')
                print(f'  Product Items: {product_items}')
                
                # Check if any category names appear in product_items
                contaminated = any(cat.lower().replace("'s", "s") in [p.lower() for p in product_items] for cat in categories)
                if contaminated:
                    print(f'  ❌ CONTAMINATED: Category found in product_items!')
                else:
                    print(f'  ✅ CLEAN: Proper separation')
                print()
            else:
                print(f'Query: "{query}" - ERROR: {response.status_code}')
        except Exception as e:
            print(f'Query: "{query}" - EXCEPTION: {e}')

if __name__ == "__main__":
    test_category_separation()
