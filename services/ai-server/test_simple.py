#!/usr/bin/env python3
"""Simple API test using Python requests"""

import requests
import json

def test_api():
    """Test the running AI server"""
    try:
        # Test health endpoint
        health_response = requests.get("http://127.0.0.1:8000/health", timeout=10)
        print("✅ Health check:")
        print(json.dumps(health_response.json(), indent=2))
        
        # Test reasoning endpoint
        reasoning_payload = {
            "instruction": "What are the key features customers look for when shopping for smartphones online?"
        }
        
        reasoning_response = requests.post(
            "http://127.0.0.1:8000/reason", 
            json=reasoning_payload,
            timeout=30
        )
        
        print("\n🧠 Reasoning response:")
        print(json.dumps(reasoning_response.json(), indent=2))
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on port 8000")
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()
