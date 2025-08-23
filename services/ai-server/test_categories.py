#!/usr/bin/env python3
"""
Comprehensive test for category detection to ensure optimized prompt works for all scenarios
"""
import requests
import json

def test_category_detection():
    print("🧪 COMPREHENSIVE CATEGORY DETECTION TEST")
    print("==========================================")
    
    # Test cases covering various scenarios
    test_cases = [
        # Basic categories
        {"query": "electronics", "expected_categories": ["electronics"], "description": "Basic electronics"},
        {"query": "i need electronics", "expected_categories": ["electronics"], "description": "Electronics with context"},
        
        # Jewelry variations
        {"query": "jewelry", "expected_categories": ["jewelery"], "description": "Jewelry (US spelling)"},
        {"query": "jewelery", "expected_categories": ["jewelery"], "description": "Jewelery (UK spelling)"},
        {"query": "show me jewelry", "expected_categories": ["jewelery"], "description": "Jewelry with context"},
        
        # Gender-specific clothing
        {"query": "men's shirts", "expected_categories": ["men's clothing"], "description": "Men's specific clothing"},
        {"query": "women's dresses", "expected_categories": ["women's clothing"], "description": "Women's specific clothing"},
        
        # Gender-neutral clothing (should include both)
        {"query": "jackets", "expected_categories": ["men's clothing", "women's clothing"], "description": "Gender-neutral jackets"},
        {"query": "shirts", "expected_categories": ["men's clothing", "women's clothing"], "description": "Gender-neutral shirts"},
        {"query": "t-shirts", "expected_categories": ["men's clothing", "women's clothing"], "description": "Gender-neutral t-shirts"},
        {"query": "jeans", "expected_categories": ["men's clothing", "women's clothing"], "description": "Gender-neutral jeans"},
        
        # Mixed queries with price constraints
        {"query": "electronics under 50", "expected_categories": ["electronics"], "description": "Electronics with price"},
        {"query": "cheap jewelry", "expected_categories": ["jewelery"], "description": "Jewelry with price context"},
        
        # Unclear queries (should return all categories)
        {"query": "something nice", "expected_categories": ["electronics", "men's clothing", "women's clothing", "jewelery"], "description": "Unclear query"},
        {"query": "gift ideas", "expected_categories": ["electronics", "men's clothing", "women's clothing", "jewelery"], "description": "Vague gift query"},
    ]
    
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i:2d}. Testing: '{test_case['query']}'")
        print(f"    Description: {test_case['description']}")
        print(f"    Expected: {test_case['expected_categories']}")
        
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
                
                print(f"    Actual:   {actual_categories}")
                
                # Check if all expected categories are present
                expected_set = set(test_case['expected_categories'])
                actual_set = set(actual_categories)
                
                if expected_set.issubset(actual_set):
                    print(f"    Result:   ✅ PASS")
                    passed += 1
                else:
                    print(f"    Result:   ❌ FAIL - Missing: {expected_set - actual_set}")
                    failed += 1
                    
            else:
                print(f"    Result:   ❌ ERROR - {response.status_code}: {response.text}")
                failed += 1
                
        except Exception as e:
            print(f"    Result:   ❌ EXCEPTION - {e}")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"📊 TEST SUMMARY:")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! Category detection is working perfectly!")
    else:
        print(f"\n⚠️  Some tests failed. The optimized prompt may need adjustments.")
    
    return failed == 0

if __name__ == "__main__":
    test_category_detection()
