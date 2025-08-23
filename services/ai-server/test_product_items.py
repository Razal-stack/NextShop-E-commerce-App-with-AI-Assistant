#!/usr/bin/env python3
"""
Test product item categorization - ensure LLM can map specific products to correct categories
"""
import requests
import json

def test_product_item_categorization():
    print("🧪 PRODUCT ITEM CATEGORIZATION TEST")
    print("=====================================")
    
    # Test cases for specific product items and their expected categories
    test_cases = [
        # Electronics products
        {"query": "mobile phone", "expected_categories": ["electronics"], "expected_items": ["mobile phone"], "description": "Mobile phone → electronics"},
        {"query": "smartphone", "expected_categories": ["electronics"], "expected_items": ["smartphone"], "description": "Smartphone → electronics"},
        {"query": "tablet", "expected_categories": ["electronics"], "expected_items": ["tablet"], "description": "Tablet → electronics"},
        {"query": "camera", "expected_categories": ["electronics"], "expected_items": ["camera"], "description": "Camera → electronics"},
        
        # Jewelry products
        {"query": "ear rings", "expected_categories": ["jewelery"], "expected_items": ["ear rings"], "description": "Ear rings → jewelery"},
        {"query": "necklace", "expected_categories": ["jewelery"], "expected_items": ["necklace"], "description": "Necklace → jewelery"},
        {"query": "bracelet", "expected_categories": ["jewelery"], "expected_items": ["bracelet"], "description": "Bracelet → jewelery"},
        {"query": "ring", "expected_categories": ["jewelery"], "expected_items": ["ring"], "description": "Ring → jewelery"},
        
        # Men's clothing
        {"query": "suit", "expected_categories": ["men's clothing"], "expected_items": ["suit"], "description": "Suit → men's clothing"},
        {"query": "tie", "expected_categories": ["men's clothing"], "expected_items": ["tie"], "description": "Tie → men's clothing"},
        {"query": "men's pants", "expected_categories": ["men's clothing"], "expected_items": ["pants"], "description": "Men's pants → men's clothing"},
        
        # Women's clothing  
        {"query": "skirt", "expected_categories": ["women's clothing"], "expected_items": ["skirt"], "description": "Skirt → women's clothing"},
        {"query": "blouse", "expected_categories": ["women's clothing"], "expected_items": ["blouse"], "description": "Blouse → women's clothing"},
        {"query": "women's pants", "expected_categories": ["women's clothing"], "expected_items": ["pants"], "description": "Women's pants → women's clothing"},
        
        # Gender-neutral clothing (should include both)
        {"query": "jacket", "expected_categories": ["men's clothing", "women's clothing"], "expected_items": ["jacket"], "description": "Jacket → both clothing categories"},
        {"query": "shirt", "expected_categories": ["men's clothing", "women's clothing"], "expected_items": ["shirt"], "description": "Shirt → both clothing categories"},
        {"query": "jeans", "expected_categories": ["men's clothing", "women's clothing"], "expected_items": ["jeans"], "description": "Jeans → both clothing categories"},
        {"query": "sneakers", "expected_categories": ["men's clothing", "women's clothing"], "expected_items": ["sneakers"], "description": "Sneakers → both clothing categories"},
        
        # Complex product queries
        {"query": "iPhone charger", "expected_categories": ["electronics"], "expected_items": ["iPhone", "charger"], "description": "iPhone charger → electronics with multiple items"},
        {"query": "gold necklace", "expected_categories": ["jewelery"], "expected_items": ["necklace"], "description": "Gold necklace → jewelery with variant"},
        {"query": "black suit", "expected_categories": ["men's clothing"], "expected_items": ["suit"], "description": "Black suit → men's clothing with variant"},
    ]
    
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i:2d}. Testing: '{test_case['query']}'")
        print(f"    Description: {test_case['description']}")
        print(f"    Expected Categories: {test_case['expected_categories']}")
        print(f"    Expected Items: {test_case['expected_items']}")
        
        data = {
            'app_name': 'nextshop',
            'user_query': test_case['query'],
            'available_categories': ['electronics', 'men\'s clothing', 'women\'s clothing', 'jewelery'],
            'conversation_history': [],
            'mcp_tools_context': [{'name': 'products.list', 'description': 'Search products'}],
            'ui_handlers_context': []
        }
        
        try:
            response = requests.post('http://localhost:8000/app-reason', json=data)
            
            if response.status_code == 200:
                result = response.json()
                entities = result['query_analysis']['detected_entities']
                actual_categories = entities.get('categories', [])
                actual_items = entities.get('product_items', [])
                
                print(f"    Actual Categories: {actual_categories}")
                print(f"    Actual Items: {actual_items}")
                
                # Check categories
                expected_cat_set = set(test_case['expected_categories'])
                actual_cat_set = set(actual_categories)
                categories_ok = expected_cat_set.issubset(actual_cat_set)
                
                # Check product items (at least one expected item should be present)
                items_ok = any(expected_item.lower() in ' '.join(actual_items).lower() 
                             for expected_item in test_case['expected_items'])
                
                if categories_ok and items_ok:
                    print(f"    Result: ✅ PASS")
                    passed += 1
                elif categories_ok:
                    print(f"    Result: ⚠️  PARTIAL - Categories correct, but items missing: {test_case['expected_items']}")
                    failed += 1
                elif items_ok:
                    print(f"    Result: ⚠️  PARTIAL - Items correct, but categories missing: {expected_cat_set - actual_cat_set}")
                    failed += 1
                else:
                    print(f"    Result: ❌ FAIL - Categories missing: {expected_cat_set - actual_cat_set}, Items missing: {test_case['expected_items']}")
                    failed += 1
                    
            else:
                print(f"    Result: ❌ ERROR - {response.status_code}: {response.text}")
                failed += 1
                
        except Exception as e:
            print(f"    Result: ❌ EXCEPTION - {e}")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"📊 PRODUCT ITEM CATEGORIZATION SUMMARY:")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! Product item categorization is working perfectly!")
    elif passed > failed:
        print(f"\n⚠️  Most tests passed, but some product item categorization needs improvement.")
    else:
        print(f"\n❌ Many tests failed. The LLM needs better product categorization training.")
    
    return failed == 0

if __name__ == "__main__":
    test_product_item_categorization()
