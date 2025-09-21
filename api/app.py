#!/usr/bin/env python3

import os
import sys
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import queue
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generate_response import (
    HumanEval_experiment, 
    evaluate_clarifying_questions,
    response_2_code,
    response_2_code_if_no_text
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

task_queue = queue.Queue()
task_results = {}

class TaskStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

def background_worker():
    while True:
        try:
            task_id, task_data = task_queue.get(timeout=1)
            task_results[task_id]['status'] = TaskStatus.RUNNING
            task_results[task_id]['started_at'] = datetime.now().isoformat()
            
            try:
                result = process_evaluation_task(task_data)
                task_results[task_id]['status'] = TaskStatus.COMPLETED
                task_results[task_id]['result'] = result
                task_results[task_id]['completed_at'] = datetime.now().isoformat()
            except Exception as e:
                task_results[task_id]['status'] = TaskStatus.FAILED
                task_results[task_id]['error'] = str(e)
                task_results[task_id]['completed_at'] = datetime.now().isoformat()
                logger.error(f"Task {task_id} failed: {e}")
            
            task_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            logger.error(f"Background worker error: {e}")

def process_evaluation_task(task_data):
    dataset = task_data.get('dataset', 'HumanEval')
    model = task_data.get('model', 'gpt-3.5-turbo')
    problem_text = task_data.get('problem_text', '')
    phase = task_data.get('phase', 0)
    
    return {
        'dataset': dataset,
        'model': model,
        'phase': phase,
        'response': 'Mock response for testing',
        'code': 'def mock_function():\n    return "Hello World"',
        'question_quality': '0',
        'answer': ''
    }

worker_thread = threading.Thread(target=background_worker, daemon=True)
worker_thread.start()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/v1/evaluate', methods=['POST'])
def evaluate_problem():
    try:
        data = request.get_json()
        
        required_fields = ['dataset', 'model', 'problem_text']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        if data['dataset'] not in ['HumanEval', 'HumanEvalComm']:
            return jsonify({'error': 'Invalid dataset. Must be HumanEval or HumanEvalComm'}), 400
        
        valid_models = ['gpt-3.5-turbo', 'gpt-4', 'Okanagan', 'AgentCoder']
        if data['model'] not in valid_models:
            return jsonify({'error': f'Invalid model. Must be one of: {valid_models}'}), 400
        
        phase = data.get('phase', 0)
        temperature = data.get('temperature', 1.0)
        topn = data.get('topn', 1)
        option = data.get('option', 'original')
        
        problem = {
            'name': 'API_Problem',
            'prompt': data['problem_text'],
            'entry_point': 'solution'
        }
        
        if data['dataset'] == 'HumanEvalComm':
            problem.update({
                'prompt1a': data['problem_text'] + ' (ambiguous version)',
                'prompt1c': data['problem_text'] + ' (inconsistent version)',
                'prompt1p': data['problem_text'] + ' (incomplete version)'
            })
        
        result = {
            'dataset': data['dataset'],
            'model': data['model'],
            'phase': phase,
            'problem_name': problem['name'],
            'response': 'Generated response would go here',
            'code': 'Generated code would go here',
            'question_quality': '0',
            'answer': '',
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in evaluate_problem: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/evaluate/async', methods=['POST'])
def evaluate_problem_async():
    try:
        data = request.get_json()
        
        required_fields = ['dataset', 'model', 'problem_text']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        task_id = f"task_{int(time.time() * 1000)}"
        
        task_results[task_id] = {
            'status': TaskStatus.PENDING,
            'created_at': datetime.now().isoformat(),
            'task_data': data
        }
        
        task_queue.put((task_id, data))
        
        return jsonify({
            'task_id': task_id,
            'status': TaskStatus.PENDING,
            'message': 'Task queued for processing'
        })
        
    except Exception as e:
        logger.error(f"Error in evaluate_problem_async: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    if task_id not in task_results:
        return jsonify({'error': 'Task not found'}), 404
    
    result = task_results[task_id].copy()
    if 'task_data' in result:
        del result['task_data']
    
    return jsonify(result)

@app.route('/api/v1/models', methods=['GET'])
def get_available_models():
    models = {
        'openai': ['gpt-3.5-turbo', 'gpt-4'],
        'agents': ['Okanagan', 'AgentCoder'],
        'open_source': [
            'codellama/CodeLlama-7b-Instruct-hf',
            'codellama/CodeLlama-13b-Instruct-hf',
            'deepseek-coder-6.7b-instruct',
            'CodeQwen1.5-7B-Chat'
        ]
    }
    return jsonify(models)

@app.route('/api/v1/datasets', methods=['GET'])
def get_available_datasets():
    datasets = {
        'HumanEval': {
            'description': 'Original HumanEval benchmark',
            'problems': 164,
            'type': 'original'
        },
        'HumanEvalComm': {
            'description': 'HumanEval with communication challenges',
            'problems': 762,
            'type': 'modified',
            'categories': ['ambiguity', 'inconsistency', 'incompleteness']
        }
    }
    return jsonify(datasets)

@app.route('/api/v1/phases', methods=['GET'])
def get_evaluation_phases():
    phases = {
        0: {
            'name': 'Initial Response',
            'description': 'Generate initial response from the model',
            'output': 'Raw model response'
        },
        1: {
            'name': 'Question Evaluation',
            'description': 'Evaluate clarifying questions using LLM-based evaluator',
            'output': 'Question quality and answers'
        },
        2: {
            'name': 'Second Round',
            'description': 'Generate second response based on Q&A',
            'output': 'Final code generation'
        },
        3: {
            'name': 'Code Extraction',
            'description': 'Extract code and run test cases',
            'output': 'Test results and metrics'
        },
        4: {
            'name': 'Metrics Computation',
            'description': 'Compute communication and quality metrics',
            'output': 'Detailed metrics'
        },
        5: {
            'name': 'Aggregation',
            'description': 'Aggregate metrics across problems',
            'output': 'Summary statistics'
        },
        6: {
            'name': 'Category Analysis',
            'description': 'Analyze results by clarification category',
            'output': 'Category-specific metrics'
        }
    }
    return jsonify(phases)

@app.route('/api/v1/evaluate/batch', methods=['POST'])
def evaluate_batch():
    try:
        data = request.get_json()
        
        required_fields = ['dataset', 'model', 'problems']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        if not isinstance(data['problems'], list) or len(data['problems']) == 0:
            return jsonify({'error': 'problems must be a non-empty list'}), 400
        
        results = []
        for i, problem in enumerate(data['problems']):
            if 'name' not in problem or 'text' not in problem:
                return jsonify({'error': f'Problem {i} missing name or text'}), 400
            
            result = {
                'problem_name': problem['name'],
                'response': f'Mock response for {problem["name"]}',
                'code': f'def {problem["name"]}():\n    return "Hello from {problem["name"]}"',
                'question_quality': '0',
                'answer': ''
            }
            results.append(result)
        
        return jsonify({
            'dataset': data['dataset'],
            'model': data['model'],
            'total_problems': len(data['problems']),
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in evaluate_batch: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Set environment variables from system environment or use defaults
    if not os.getenv('OPENAI_KEY'):
        os.environ['OPENAI_KEY'] = os.getenv('OPENAI_API_KEY', '')
    if not os.getenv('OPENAI_API_KEY'):
        os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_KEY', '')
    
    print("🚀 Starting HumanEvalComm API Server...")
    print("📚 Available endpoints:")
    print("   GET  /health - Health check")
    print("   GET  /api/v1/models - Available models")
    print("   GET  /api/v1/datasets - Available datasets")
    print("   GET  /api/v1/phases - Evaluation phases")
    print("   POST /api/v1/evaluate - Evaluate single problem")
    print("   POST /api/v1/evaluate/async - Start async evaluation")
    print("   GET  /api/v1/tasks/<task_id> - Get task status")
    print("   POST /api/v1/evaluate/batch - Evaluate multiple problems")
    print("\n🌐 Server will be available at: http://localhost:5001")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
