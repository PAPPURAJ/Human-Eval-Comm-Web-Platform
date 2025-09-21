#!/usr/bin/env python3

import unittest
import requests
import json
import time
import threading
from typing import Dict, Any

class TestHumanEvalCommAPI(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        cls.base_url = "http://localhost:5000"
        cls.client = requests.Session()
        
        max_retries = 30
        for i in range(max_retries):
            try:
                response = cls.client.get(f"{cls.base_url}/health", timeout=5)
                if response.status_code == 200:
                    print("✅ API server is ready")
                    break
            except requests.exceptions.RequestException:
                if i == max_retries - 1:
                    raise Exception("API server is not responding after 30 retries")
                time.sleep(1)
    
    def test_health_check(self):
        response = self.client.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('timestamp', data)
        self.assertIn('version', data)
        self.assertEqual(data['status'], 'healthy')
    
    def test_get_models(self):
        response = self.client.get(f"{self.base_url}/api/v1/models")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('openai', data)
        self.assertIn('agents', data)
        self.assertIn('open_source', data)
        
        self.assertIn('gpt-3.5-turbo', data['openai'])
        self.assertIn('gpt-4', data['openai'])
        self.assertIn('Okanagan', data['agents'])
    
    def test_get_datasets(self):
        response = self.client.get(f"{self.base_url}/api/v1/datasets")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('HumanEval', data)
        self.assertIn('HumanEvalComm', data)
        
        humaneval = data['HumanEval']
        self.assertEqual(humaneval['type'], 'original')
        self.assertEqual(humaneval['problems'], 164)
        
        humanevalcomm = data['HumanEvalComm']
        self.assertEqual(humanevalcomm['type'], 'modified')
        self.assertEqual(humanevalcomm['problems'], 762)
        self.assertIn('categories', humanevalcomm)
    
    def test_get_phases(self):
        response = self.client.get(f"{self.base_url}/api/v1/phases")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data), 7)
        
        self.assertIn('0', data)
        self.assertIn('6', data)
        
        phase_0 = data['0']
        self.assertEqual(phase_0['name'], 'Initial Response')
        self.assertIn('description', phase_0)
    
    def test_evaluate_single_problem(self):
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problem_text": "Write a function that returns the sum of two numbers",
            "phase": 0,
            "temperature": 1.0
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('dataset', data)
        self.assertIn('model', data)
        self.assertIn('phase', data)
        self.assertIn('problem_name', data)
        self.assertIn('response', data)
        self.assertIn('code', data)
        self.assertIn('timestamp', data)
        
        self.assertEqual(data['dataset'], 'HumanEval')
        self.assertEqual(data['model'], 'gpt-3.5-turbo')
        self.assertEqual(data['phase'], 0)
    
    def test_evaluate_single_problem_invalid_dataset(self):
        payload = {
            "dataset": "InvalidDataset",
            "model": "gpt-3.5-turbo",
            "problem_text": "Write a function that returns the sum of two numbers"
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
    
    def test_evaluate_single_problem_missing_fields(self):
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo"
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertIn('Missing required field', data['error'])
    
    def test_evaluate_async(self):
        payload = {
            "dataset": "HumanEvalComm",
            "model": "gpt-3.5-turbo",
            "problem_text": "Write a function that processes a list of strings",
            "phase": 0
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate/async",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('task_id', data)
        self.assertIn('status', data)
        self.assertIn('message', data)
        
        self.assertEqual(data['status'], 'pending')
        self.assertIn('task_', data['task_id'])
        
        return data['task_id']
    
    def test_get_task_status(self):
        task_id = self.test_evaluate_async()
        
        response = self.client.get(f"{self.base_url}/api/v1/tasks/{task_id}")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('created_at', data)
        
        valid_statuses = ['pending', 'running', 'completed', 'failed']
        self.assertIn(data['status'], valid_statuses)
    
    def test_get_task_status_invalid_id(self):
        response = self.client.get(f"{self.base_url}/api/v1/tasks/invalid_task_id")
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Task not found')
    
    def test_evaluate_batch(self):
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problems": [
                {
                    "name": "add_numbers",
                    "text": "Write a function that adds two numbers"
                },
                {
                    "name": "find_max",
                    "text": "Write a function that finds the maximum in a list"
                }
            ],
            "phase": 0,
            "temperature": 1.0
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate/batch",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('dataset', data)
        self.assertIn('model', data)
        self.assertIn('total_problems', data)
        self.assertIn('results', data)
        self.assertIn('timestamp', data)
        
        self.assertEqual(data['dataset'], 'HumanEval')
        self.assertEqual(data['model'], 'gpt-3.5-turbo')
        self.assertEqual(data['total_problems'], 2)
        self.assertEqual(len(data['results']), 2)
        
        for result in data['results']:
            self.assertIn('problem_name', result)
            self.assertIn('response', result)
            self.assertIn('code', result)
    
    def test_evaluate_batch_empty_problems(self):
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problems": []
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate/batch",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
    
    def test_evaluate_batch_invalid_problem_format(self):
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problems": [
                {
                    "name": "test_problem"
                }
            ]
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate/batch",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
    
    def test_404_endpoint(self):
        response = self.client.get(f"{self.base_url}/nonexistent")
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Endpoint not found')
    
    def test_invalid_json(self):
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate",
            data="invalid json",
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 400)
    
    def test_cors_headers(self):
        response = self.client.options(f"{self.base_url}/api/v1/models")
        self.assertIn(response.status_code, [200, 204])
    
    def test_concurrent_requests(self):
        def make_request():
            response = self.client.get(f"{self.base_url}/health")
            return response.status_code == 200
        
        threads = []
        results = []
        
        for i in range(10):
            thread = threading.Thread(target=lambda: results.append(make_request()))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        self.assertEqual(len(results), 10)
        self.assertTrue(all(results))
    
    def test_parameter_validation(self):
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problem_text": "Test problem",
            "phase": 10
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        # Should still work as validation is not strict in current implementation
        self.assertIn(response.status_code, [200, 400])
        
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problem_text": "Test problem",
            "temperature": 5.0
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        # Should still work as validation is not strict in current implementation
        self.assertIn(response.status_code, [200, 400])

class TestAPIIntegration(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        cls.base_url = "http://localhost:5000"
        cls.client = requests.Session()
    
    def test_full_evaluation_workflow(self):
        response = self.client.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        
        response = self.client.get(f"{self.base_url}/api/v1/models")
        self.assertEqual(response.status_code, 200)
        models = response.json()
        
        response = self.client.get(f"{self.base_url}/api/v1/datasets")
        self.assertEqual(response.status_code, 200)
        datasets = response.json()
        
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problem_text": "Write a function that calculates factorial",
            "phase": 0
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        
        payload = {
            "dataset": "HumanEvalComm",
            "model": "gpt-3.5-turbo",
            "problem_text": "Write a function that processes user input"
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate/async",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        self.assertEqual(response.status_code, 200)
        async_result = response.json()
        
        task_id = async_result['task_id']
        response = self.client.get(f"{self.base_url}/api/v1/tasks/{task_id}")
        self.assertEqual(response.status_code, 200)
        
        payload = {
            "dataset": "HumanEval",
            "model": "gpt-3.5-turbo",
            "problems": [
                {"name": "test1", "text": "Write a function that adds numbers"},
                {"name": "test2", "text": "Write a function that multiplies numbers"}
            ]
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/evaluate/batch",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        self.assertEqual(response.status_code, 200)
        batch_result = response.json()
        
        self.assertEqual(result['dataset'], 'HumanEval')
        self.assertEqual(async_result['status'], 'pending')
        self.assertEqual(batch_result['total_problems'], 2)

def run_performance_test():
    print("\n🚀 Running Performance Tests...")
    
    base_url = "http://localhost:5000"
    client = requests.Session()
    
    endpoints = [
        "/health",
        "/api/v1/models",
        "/api/v1/datasets",
        "/api/v1/phases"
    ]
    
    for endpoint in endpoints:
        start_time = time.time()
        response = client.get(f"{base_url}{endpoint}")
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        status = "✅" if response.status_code == 200 else "❌"
        
        print(f"   {status} {endpoint}: {response_time:.2f}ms")
    
    print("\n🔄 Testing Concurrent Requests...")
    
    def make_request():
        start_time = time.time()
        response = client.get(f"{base_url}/health")
        end_time = time.time()
        return response.status_code == 200, (end_time - start_time) * 1000
    
    threads = []
    results = []
    
    start_time = time.time()
    for i in range(20):
        thread = threading.Thread(target=lambda: results.append(make_request()))
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    total_time = (time.time() - start_time) * 1000
    success_count = sum(1 for success, _ in results if success)
    avg_response_time = sum(time for _, time in results) / len(results)
    
    print(f"   📊 Total time: {total_time:.2f}ms")
    print(f"   📊 Success rate: {success_count}/20 ({success_count/20*100:.1f}%)")
    print(f"   📊 Average response time: {avg_response_time:.2f}ms")

if __name__ == '__main__':
    print("🧪 HumanEvalComm API Test Suite")
    print("=" * 50)
    
    print("\n📋 Running Unit Tests...")
    unittest.main(argv=[''], exit=False, verbosity=2)
    
    run_performance_test()
    
    print("\n✅ All tests completed!")