#!/usr/bin/env python3
"""Test script for the AI Reasoning Server API."""

import requests
import json

def test_reasoning_endpoint():
    """Test the /reason endpoint."""
    url = "http://127.0.0.1:8000/reason"
    payload = {
        "instruction": "What is 2+2? Please explain your reasoning."
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Is it running on port 8000?")
    except Exception as e:
        print(f"Error: {e}")

def test_health_endpoint():
    """Test the /health endpoint."""
    url = "http://127.0.0.1:8000/health"
    
    try:
        response = requests.get(url)
        print(f"Health Status: {response.status_code}")
        print(f"Health Response: {json.dumps(response.json(), indent=2)}")
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Is it running on port 8000?")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing AI Reasoning Server API...")
    print("=" * 40)
    
    print("\n1. Testing Health Endpoint:")
    test_health_endpoint()
    
    print("\n2. Testing Reasoning Endpoint:")
    test_reasoning_endpoint()
    
    print("\nDone!")
