#!/usr/bin/env python3
"""
Quick manual test script for HumanEvalComm API
"""

import requests
import json
import time

def test_api():
    """Quick API test"""
    base_url = "http://localhost:5000"
    
    print("🧪 Quick API Test")
    print("=" * 30)
    
    # Test 1: Health check
    print("1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("   ✅ Health check passed")
            print(f"   📊 Response: {response.json()}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False
    
    # Test 2: Get models
    print("\n2. Testing get models...")
    try:
        response = requests.get(f"{base_url}/api/v1/models")
        if response.status_code == 200:
            print("   ✅ Get models passed")
            models = response.json()
            print(f"   🤖 OpenAI models: {models['openai']}")
        else:
            print(f"   ❌ Get models failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Get models error: {e}")
    
    # Test 3: Get datasets
    print("\n3. Testing get datasets...")
    try:
        response = requests.get(f"{base_url}/api/v1/datasets")
        if response.status_code == 200:
            print("   ✅ Get datasets passed")
            datasets = response.json()
            for name, info in datasets.items():
                print(f"   📊 {name}: {info['problems']} problems")
        else:
            print(f"   ❌ Get datasets failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Get datasets error: {e}")
    
    # Test 4: Evaluate single problem
    print("\n4. Testing single problem evaluation...")
    try:
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problem_text": "Write a function that returns the sum of two numbers",
            "phase": 0
        }
        
        response = requests.post(
            f"{base_url}/api/v1/evaluate",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print("   ✅ Single evaluation passed")
            result = response.json()
            print(f"   📝 Problem: {result['problem_name']}")
            print(f"   🤖 Model: {result['model']}")
            print(f"   📊 Dataset: {result['dataset']}")
        else:
            print(f"   ❌ Single evaluation failed: {response.status_code}")
            print(f"   📄 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Single evaluation error: {e}")
    
    # Test 5: Async evaluation
    print("\n5. Testing async evaluation...")
    try:
        payload = {
            "dataset": "HumanEvalComm",
            "model": "gpt-3.5-turbo",
            "problem_text": "Write a function that processes a list of strings"
        }
        
        response = requests.post(
            f"{base_url}/api/v1/evaluate/async",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print("   ✅ Async evaluation started")
            result = response.json()
            task_id = result['task_id']
            print(f"   🆔 Task ID: {task_id}")
            
            # Check task status
            time.sleep(1)
            status_response = requests.get(f"{base_url}/api/v1/tasks/{task_id}")
            if status_response.status_code == 200:
                status = status_response.json()
                print(f"   📊 Task status: {status['status']}")
            else:
                print(f"   ❌ Failed to get task status: {status_response.status_code}")
        else:
            print(f"   ❌ Async evaluation failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Async evaluation error: {e}")
    
    # Test 6: Batch evaluation
    print("\n6. Testing batch evaluation...")
    try:
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problems": [
                {"name": "add", "text": "Write a function that adds two numbers"},
                {"name": "multiply", "text": "Write a function that multiplies two numbers"}
            ]
        }
        
        response = requests.post(
            f"{base_url}/api/v1/evaluate/batch",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print("   ✅ Batch evaluation passed")
            result = response.json()
            print(f"   📊 Total problems: {result['total_problems']}")
            print(f"   📝 Results: {len(result['results'])}")
        else:
            print(f"   ❌ Batch evaluation failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Batch evaluation error: {e}")
    
    print("\n✅ Quick test completed!")
    return True

if __name__ == "__main__":
    test_api()