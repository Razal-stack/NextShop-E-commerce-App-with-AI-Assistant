#!/usr/bin/env python3
"""
Test the AI server response for jackets query
"""
import requests
import json

def test_jackets_query():
    try:
        # Use the app-reason endpoint which is designed for NextShop
        payload = {
            'app_name': 'nextshop',
            'user_query': 'i need jackets',
            'available_categories': ['electronics', "men's clothing", "women's clothing", 'jewelery'],
            'conversation_history': [],
            'mcp_tools_context': [{'name': 'products.list', 'description': 'Search products'}],
            'ui_handlers_context': []
        }
        
        response = requests.post('http://localhost:8000/app-reason', 
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print('=== AI Server Response ===')
            print(json.dumps(result, indent=2))
            
            # Check execution plan format
            if 'execution_plan' in result and result['execution_plan']:
                print('\n=== Execution Plan Details ===')
                for i, step in enumerate(result['execution_plan']):
                    tool_name = step.get('tool_name', 'unknown')
                    parameters = step.get('parameters', {})
                    print(f'Step {i+1}: {tool_name}')
                    print(f'Parameters: {json.dumps(parameters, indent=2)}')
                    
                    # Check if it has categories parameter
                    if 'categories' in parameters:
                        print(f'✅ Found categories parameter: {parameters["categories"]}')
                    elif 'category' in parameters:
                        print(f'⚠️  Found single category parameter: {parameters["category"]}')
                    else:
                        print('❌ No category parameter found')
        else:
            print(f'HTTP Error: {response.status_code}')
            print(response.text)
            
    except Exception as e:
        print(f'Connection error: {e}')

if __name__ == "__main__":
    test_jackets_query()
