#!/usr/bin/env python3

import requests
import json

print('🧪 TESTING BACKEND INTEGRATION WITH FIXED AI SERVER')
print('=' * 55)

# Test the problematic query through backend
test_query = 'find products under 100 pounds and add to cart'

try:
    # Test backend integration
    response = requests.post('http://localhost:3001/api/ai/query', json={
        'query': test_query,
        'userId': 1,
        'conversationHistory': []
    })

    if response.status_code == 200:
        result = response.json()
        
        print(f'Query: "{test_query}"')
        print(f'Success: {result.get("success")}')
        
        if result.get('success') and 'result' in result:
            backend_result = result['result']
            print(f'Message: {backend_result.get("message")}')
            print(f'Display Mode: {backend_result.get("displayMode")}')
            
            if 'data' in backend_result and backend_result['data']:
                data = backend_result['data']
                print(f'Products found: {data.get("totalFound", 0)}')
                
                # Show first few products if any
                products = data.get('products', [])
                if products:
                    print(f'\nFirst few products:')
                    for i, product in enumerate(products[:3]):
                        print(f'  {i+1}. {product.get("title", "Unknown")} - £{product.get("price", "Unknown")}')
                
            # Check if actions are present (indicates UI handlers were processed)
            actions = backend_result.get('actions', [])
            if actions:
                print(f'✅ UI HANDLERS DETECTED: {len(actions)} actions')
                for action in actions:
                    print(f'  - {action.get("type", "unknown")}: {action.get("payload", {})}')
            else:
                print('❓ NO UI HANDLERS/ACTIONS FOUND')
        else:
            print('❌ BACKEND RESPONSE NOT SUCCESSFUL')
            print(f'Error: {result.get("error", "Unknown error")}')
            
    else:
        print(f'❌ Backend API Error: {response.status_code}')
        print(response.text)
        
except Exception as e:
    print(f'❌ Exception: {e}')
