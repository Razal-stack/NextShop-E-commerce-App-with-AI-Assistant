#!/usr/bin/env python3

import requests
import json
import time

class SimpleIntegrationTest:
    def __init__(self):
        self.ai_server_url = "http://localhost:8000"
        
    def test_ai_server_health(self):
        """Test AI reasoning server health"""
        print("🔍 Testing AI Server Health...")
        try:
            response = requests.get(f"{self.ai_server_url}/health", timeout=5)
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ AI Server: {health_data['status']}")
                if 'model_info' in health_data:
                    print(f"   Model: {health_data['model_info'].get('text_model', 'Unknown')}")
                return True
            else:
                print(f"❌ AI Server health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ AI Server connection failed: {e}")
            return False
    
    def test_app_reasoning(self):
        """Test the app-specific reasoning endpoint"""
        print("\n🔍 Testing NextShop App Reasoning...")
        
        request_data = {
            "app_name": "nextshop",
            "user_query": "I want to buy a laptop under £500 for programming",
            "available_categories": ["electronics", "men's clothing", "women's clothing", "jewelery"],
            "conversation_history": [],
            "mcp_tools_context": [
                {
                    "name": "products.list",
                    "description": "Search and list products with filtering",
                    "parameters": {
                        "category": "optional string",
                        "priceMax": "optional number",
                        "query": "optional string"
                    }
                },
                {
                    "name": "cart.add",
                    "description": "Add product to shopping cart",
                    "parameters": {
                        "productId": "required string",
                        "quantity": "required number"
                    }
                },
                {
                    "name": "cart.get",
                    "description": "Get current cart contents",
                    "parameters": {}
                }
            ],
            "ui_handlers_context": [
                {
                    "name": "add_to_cart",
                    "description": "Add selected products to shopping cart",
                    "requires_data": True,
                    "data_format": "product_list"
                },
                {
                    "name": "show_product_details",
                    "description": "Display detailed product information",
                    "requires_data": True,
                    "data_format": "product_id"
                },
                {
                    "name": "login_required",
                    "description": "Prompt user to login",
                    "requires_data": False
                }
            ],
            "user_session": {
                "user_id": 12345,
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }
        
        try:
            print("   Sending request to AI reasoning server...")
            response = requests.post(
                f"{self.ai_server_url}/app-reason",
                json=request_data,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("✅ App reasoning successful!")
                print(f"   Intent: {result['query_analysis']['intent']}")
                print(f"   Confidence: {result['query_analysis']['confidence']:.2f}")
                print(f"   Processing time: {result['processing_time_ms']}ms")
                print(f"   Model used: {result['model_used']}")
                
                if result['execution_plan']:
                    print(f"   Execution plan: {len(result['execution_plan'])} steps")
                    for i, step in enumerate(result['execution_plan'][:3], 1):
                        print(f"      {i}. {step['description']} ({step['tool_name']})")
                    
                    if len(result['execution_plan']) > 3:
                        print(f"      ... and {len(result['execution_plan']) - 3} more steps")
                
                if result.get('ui_guidance'):
                    print(f"   UI Guidance: {result['ui_guidance'][:100]}...")
                
                return True
            else:
                print(f"❌ App reasoning failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
                
        except requests.exceptions.Timeout:
            print("❌ Request timed out (30s)")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def test_basic_reasoning(self):
        """Test basic reasoning endpoint"""
        print("\n🔍 Testing Basic Reasoning...")
        
        request_data = {
            "query": "What are the key features customers look for when shopping for smartphones online?",
            "context": "",
            "max_tokens": 150
        }
        
        try:
            response = requests.post(
                f"{self.ai_server_url}/reason",
                json=request_data,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Basic reasoning successful!")
                print(f"   Response: {result['response'][:100]}...")
                print(f"   Processing time: {result['processing_time_ms']}ms")
                return True
            else:
                print(f"❌ Basic reasoning failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def run_tests(self):
        """Run all tests"""
        print("🚀 NextShop AI Simple Integration Test")
        print("=" * 50)
        
        results = []
        
        # Test server health
        results.append(self.test_ai_server_health())
        
        # Only run other tests if server is healthy
        if results[0]:
            results.append(self.test_basic_reasoning())
            results.append(self.test_app_reasoning())
        
        # Summary
        success_count = sum(results)
        total_tests = len(results)
        
        print(f"\n🎯 Test Results: {success_count}/{total_tests} passed")
        if success_count == total_tests:
            print("🎉 All tests passed! AI Server integration is working.")
        else:
            print("⚠️  Some tests failed. Check the logs above.")
        
        return success_count == total_tests

def main():
    tester = SimpleIntegrationTest()
    success = tester.run_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
