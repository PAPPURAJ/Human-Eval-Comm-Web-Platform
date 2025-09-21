# HumanEvalComm API Documentation

A REST API for the HumanEvalComm benchmark system that evaluates the communication skills of Large Language Models in code generation tasks.

## Quick Start

### 1. Start the API Server

```bash
# Activate virtual environment
source venv/bin/activate

# Set your OpenAI API key
export OPENAI_KEY='your-openai-api-key'
export OPENAI_API_KEY='your-openai-api-key'

# Start the server
python api/app.py
```

The server will be available at `http://localhost:5000`

### 2. Test the API

```bash
# Health check
curl http://localhost:5000/health

# Get available models
curl http://localhost:5000/api/v1/models

# Get available datasets
curl http://localhost:5000/api/v1/datasets
```

## API Endpoints

### Health Check

**GET** `/health`

Check if the API server is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0.0"
}
```

### Get Available Models

**GET** `/api/v1/models`

Get list of available models for evaluation.

**Response:**
```json
{
  "openai": ["gpt-3.5-turbo", "gpt-4"],
  "agents": ["Okanagan", "AgentCoder"],
  "open_source": [
    "codellama/CodeLlama-7b-Instruct-hf",
    "codellama/CodeLlama-13b-Instruct-hf",
    "deepseek-coder-6.7b-instruct",
    "CodeQwen1.5-7B-Chat"
  ]
}
```

### Get Available Datasets

**GET** `/api/v1/datasets`

Get information about available datasets.

**Response:**
```json
{
  "HumanEval": {
    "description": "Original HumanEval benchmark",
    "problems": 164,
    "type": "original"
  },
  "HumanEvalComm": {
    "description": "HumanEval with communication challenges",
    "problems": 762,
    "type": "modified",
    "categories": ["ambiguity", "inconsistency", "incompleteness"]
  }
}
```

### Get Evaluation Phases

**GET** `/api/v1/phases`

Get description of evaluation phases.

**Response:**
```json
{
  "0": {
    "name": "Initial Response",
    "description": "Generate initial response from the model",
    "output": "Raw model response"
  },
  "1": {
    "name": "Question Evaluation",
    "description": "Evaluate clarifying questions using LLM-based evaluator",
    "output": "Question quality and answers"
  }
}
```

### Evaluate Single Problem

**POST** `/api/v1/evaluate`

Evaluate a single coding problem.

**Request Body:**
```json
{
  "dataset": "HumanEval",
  "model": "gpt-3.5-turbo",
  "problem_text": "Write a function that returns the sum of two numbers",
  "phase": 0,
  "temperature": 1.0,
  "topn": 1,
  "option": "original"
}
```

**Response:**
```json
{
  "dataset": "HumanEval",
  "model": "gpt-3.5-turbo",
  "phase": 0,
  "problem_name": "API_Problem",
  "response": "Generated response would go here",
  "code": "Generated code would go here",
  "question_quality": "0",
  "answer": "",
  "timestamp": "2024-01-15T10:30:00"
}
```

### Evaluate Problem (Async)

**POST** `/api/v1/evaluate/async`

Start an asynchronous evaluation task.

**Request Body:**
```json
{
  "dataset": "HumanEvalComm",
  "model": "gpt-3.5-turbo",
  "problem_text": "Write a function that processes a list of strings",
  "phase": 0
}
```

**Response:**
```json
{
  "task_id": "task_1705312200000",
  "status": "pending",
  "message": "Task queued for processing"
}
```

### Get Task Status

**GET** `/api/v1/tasks/{task_id}`

Get the status of an asynchronous task.

**Response:**
```json
{
  "status": "completed",
  "created_at": "2024-01-15T10:30:00",
  "started_at": "2024-01-15T10:30:01",
  "completed_at": "2024-01-15T10:30:05",
  "result": {
    "dataset": "HumanEvalComm",
    "model": "gpt-3.5-turbo",
    "response": "Generated response",
    "code": "Generated code"
  }
}
```

### Batch Evaluation

**POST** `/api/v1/evaluate/batch`

Evaluate multiple problems in batch.

**Request Body:**
```json
{
  "dataset": "HumanEval",
  "model": "gpt-3.5-turbo",
  "problems": [
    {
      "name": "problem1",
      "text": "Write a function that adds two numbers"
    },
    {
      "name": "problem2", 
      "text": "Write a function that finds the maximum in a list"
    }
  ],
  "phase": 0,
  "temperature": 1.0
}
```

**Response:**
```json
{
  "dataset": "HumanEval",
  "model": "gpt-3.5-turbo",
  "total_problems": 2,
  "results": [
    {
      "problem_name": "problem1",
      "response": "Mock response for problem1",
      "code": "def problem1():\n    return \"Hello from problem1\"",
      "question_quality": "0",
      "answer": ""
    },
    {
      "problem_name": "problem2",
      "response": "Mock response for problem2", 
      "code": "def problem2():\n    return \"Hello from problem2\"",
      "question_quality": "0",
      "answer": ""
    }
  ],
  "timestamp": "2024-01-15T10:30:00"
}
```

## Request Parameters

### Required Parameters

- **dataset**: `"HumanEval"` or `"HumanEvalComm"`
- **model**: Model name (see `/api/v1/models` for available options)
- **problem_text**: Description of the coding problem

### Optional Parameters

- **phase**: Evaluation phase (0-6, default: 0)
- **temperature**: Sampling temperature (0.0-2.0, default: 1.0)
- **topn**: Number of responses to generate (1-10, default: 1)
- **option**: Evaluation mode (`"original"` or `"manualRemove"`, default: `"original"`)
- **min_problem_idx**: Minimum problem index (default: -1)
- **max_num_problems**: Maximum number of problems (default: -1)

## Evaluation Phases

| Phase | Name | Description |
|-------|------|-------------|
| 0 | Initial Response | Generate initial response from the model |
| 1 | Question Evaluation | Evaluate clarifying questions using LLM-based evaluator |
| 2 | Second Round | Generate second response based on Q&A |
| 3 | Code Extraction | Extract code and run test cases |
| 4 | Metrics Computation | Compute communication and quality metrics |
| 5 | Aggregation | Aggregate metrics across problems |
| 6 | Category Analysis | Analyze results by clarification category |

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (endpoint or task not found)
- `500`: Internal Server Error

## Examples

### Python Client Example

```python
import requests
import json

# API base URL
BASE_URL = "http://localhost:5000"

# Evaluate a problem
def evaluate_problem(problem_text, model="gpt-3.5-turbo", dataset="HumanEval"):
    url = f"{BASE_URL}/api/v1/evaluate"
    data = {
        "dataset": dataset,
        "model": model,
        "problem_text": problem_text,
        "phase": 0,
        "temperature": 1.0
    }
    
    response = requests.post(url, json=data)
    return response.json()

# Example usage
result = evaluate_problem(
    "Write a function that returns the factorial of a number",
    model="gpt-3.5-turbo",
    dataset="HumanEval"
)
print(json.dumps(result, indent=2))
```

### cURL Examples

```bash
# Health check
curl -X GET http://localhost:5000/health

# Evaluate a problem
curl -X POST http://localhost:5000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": "HumanEval",
    "model": "gpt-3.5-turbo", 
    "problem_text": "Write a function that sorts a list of numbers",
    "phase": 0
  }'

# Start async evaluation
curl -X POST http://localhost:5000/api/v1/evaluate/async \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": "HumanEvalComm",
    "model": "gpt-3.5-turbo",
    "problem_text": "Write a function that processes user input"
  }'

# Check task status
curl -X GET http://localhost:5000/api/v1/tasks/task_1705312200000
```

## Configuration

### Environment Variables

- `OPENAI_KEY`: Your OpenAI API key
- `OPENAI_API_KEY`: Alternative OpenAI API key variable
- `FLASK_ENV`: Set to `development` for debug mode

### Server Configuration

The API server runs on:
- Host: `0.0.0.0` (all interfaces)
- Port: `5000`
- Debug mode: Enabled by default

## Rate Limiting

Currently, the API does not implement rate limiting. For production use, consider implementing rate limiting based on your needs.

## Security Notes

- Always use HTTPS in production
- Implement proper authentication and authorization
- Validate and sanitize all input data
- Set appropriate CORS policies
- Monitor API usage and implement logging
