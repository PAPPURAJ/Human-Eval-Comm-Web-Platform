#!/usr/bin/env python3

import requests
import json
import time
from typing import Dict, Any

class HumanEvalCommClient:
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def health_check(self) -> Dict[str, Any]:
        response = self.session.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()
    
    def get_models(self) -> Dict[str, Any]:
        response = self.session.get(f"{self.base_url}/api/v1/models")
        response.raise_for_status()
        return response.json()
    
    def get_datasets(self) -> Dict[str, Any]:
        response = self.session.get(f"{self.base_url}/api/v1/datasets")
        response.raise_for_status()
        return response.json()
    
    def get_phases(self) -> Dict[str, Any]:
        response = self.session.get(f"{self.base_url}/api/v1/phases")
        response.raise_for_status()
        return response.json()
    
    def evaluate_problem(self, 
                        dataset: str,
                        model: str,
                        problem_text: str,
                        phase: int = 0,
                        temperature: float = 1.0,
                        topn: int = 1,
                        option: str = "original") -> Dict[str, Any]:
        data = {
            "dataset": dataset,
            "model": model,
            "problem_text": problem_text,
            "phase": phase,
            "temperature": temperature,
            "topn": topn,
            "option": option
        }
        
        response = self.session.post(f"{self.base_url}/api/v1/evaluate", json=data)
        response.raise_for_status()
        return response.json()
    
    def evaluate_problem_async(self, 
                              dataset: str,
                              model: str,
                              problem_text: str,
                              phase: int = 0) -> Dict[str, Any]:
        data = {
            "dataset": dataset,
            "model": model,
            "problem_text": problem_text,
            "phase": phase
        }
        
        response = self.session.post(f"{self.base_url}/api/v1/evaluate/async", json=data)
        response.raise_for_status()
        return response.json()
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        response = self.session.get(f"{self.base_url}/api/v1/tasks/{task_id}")
        response.raise_for_status()
        return response.json()
    
    def wait_for_task(self, task_id: str, timeout: int = 300) -> Dict[str, Any]:
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            status = self.get_task_status(task_id)
            
            if status['status'] in ['completed', 'failed']:
                return status
            
            time.sleep(1)
        
        raise TimeoutError(f"Task {task_id} did not complete within {timeout} seconds")
    
    def evaluate_batch(self, 
                      dataset: str,
                      model: str,
                      problems: list,
                      phase: int = 0,
                      temperature: float = 1.0) -> Dict[str, Any]:
        data = {
            "dataset": dataset,
            "model": model,
            "problems": problems,
            "phase": phase,
            "temperature": temperature
        }
        
        response = self.session.post(f"{self.base_url}/api/v1/evaluate/batch", json=data)
        response.raise_for_status()
        return response.json()

def main():
    client = HumanEvalCommClient()
    
    print("🧪 Testing HumanEvalComm API Client")
    print("=" * 50)
    
    try:
        print("1. Health Check...")
        health = client.health_check()
        print(f"   ✅ Status: {health['status']}")
        print(f"   📅 Timestamp: {health['timestamp']}")
        print()
        
        print("2. Available Models...")
        models = client.get_models()
        print(f"   🤖 OpenAI: {models['openai']}")
        print(f"   🎯 Agents: {models['agents']}")
        print()
        
        print("3. Available Datasets...")
        datasets = client.get_datasets()
        for name, info in datasets.items():
            print(f"   📊 {name}: {info['description']} ({info['problems']} problems)")
        print()
        
        print("4. Evaluation Phases...")
        phases = client.get_phases()
        for phase_id, phase_info in phases.items():
            print(f"   🔄 Phase {phase_id}: {phase_info['name']}")
        print()
        
        print("5. Single Problem Evaluation...")
        problem_text = "Write a function that returns the sum of two numbers"
        result = client.evaluate_problem(
            dataset="HumanEval",
            model="gpt-3.5-turbo",
            problem_text=problem_text,
            phase=0
        )
        print(f"   📝 Problem: {result['problem_name']}")
        print(f"   🤖 Model: {result['model']}")
        print(f"   📊 Dataset: {result['dataset']}")
        print(f"   🔄 Phase: {result['phase']}")
        print()
        
        print("6. Async Evaluation...")
        async_result = client.evaluate_problem_async(
            dataset="HumanEvalComm",
            model="gpt-3.5-turbo",
            problem_text="Write a function that processes a list of strings"
        )
        task_id = async_result['task_id']
        print(f"   🆔 Task ID: {task_id}")
        print(f"   📊 Status: {async_result['status']}")
        
        print("7. Task Status Check...")
        task_status = client.get_task_status(task_id)
        print(f"   📊 Status: {task_status['status']}")
        print()
        
        print("8. Batch Evaluation...")
        problems = [
            {"name": "add_numbers", "text": "Write a function that adds two numbers"},
            {"name": "find_max", "text": "Write a function that finds the maximum in a list"}
        ]
        batch_result = client.evaluate_batch(
            dataset="HumanEval",
            model="gpt-3.5-turbo",
            problems=problems
        )
        print(f"   📊 Total Problems: {batch_result['total_problems']}")
        print(f"   📝 Results: {len(batch_result['results'])}")
        print()
        
        print("✅ All tests completed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API server")
        print("   Make sure the server is running on http://localhost:5000")
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        if hasattr(e, 'response'):
            print(f"   Response: {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
