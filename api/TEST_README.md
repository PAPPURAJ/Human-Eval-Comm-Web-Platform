# HumanEvalComm API Tests

This directory contains comprehensive tests for the HumanEvalComm API.

## Files

- `test_api.py` - Main test suite with comprehensive API endpoint tests
- `run_tests.py` - Test runner script for easy execution
- `test_client.py` - Client library for testing the API (already existed)

## Test Coverage

The test suite covers:

### API Endpoints
- ✅ Health check (`/health`)
- ✅ Get available models (`/api/v1/models`)
- ✅ Get available datasets (`/api/v1/datasets`)
- ✅ Get evaluation phases (`/api/v1/phases`)
- ✅ Evaluate single problem (`/api/v1/evaluate`)
- ✅ Async evaluation (`/api/v1/evaluate/async`)
- ✅ Task status check (`/api/v1/tasks/<task_id>`)
- ✅ Batch evaluation (`/api/v1/evaluate/batch`)

### Validation & Error Handling
- ✅ Required field validation
- ✅ Invalid dataset/model validation
- ✅ Invalid parameter validation
- ✅ 404 error handling
- ✅ JSON parsing errors
- ✅ Batch size limits

### Edge Cases
- ✅ Empty requests
- ✅ Large batch requests
- ✅ Concurrent requests
- ✅ Task queue functionality
- ✅ Different phases and models

### Data Models
- ✅ Request validation functions
- ✅ Batch request validation
- ✅ Parameter range validation

## Running Tests

### Option 1: Using the test runner script
```bash
# Run all tests
python run_tests.py

# Run specific test
python run_tests.py test_health_check
```

### Option 2: Using pytest directly
```bash
# Run all tests
pytest test_api.py -v

# Run specific test class
pytest test_api.py::TestHumanEvalCommAPI -v

# Run specific test method
pytest test_api.py::TestHumanEvalCommAPI::test_health_check -v

# Run with coverage
pytest test_api.py --cov=app --cov-report=html
```

### Option 3: Using the existing test client
```bash
# Make sure the API server is running first
python app.py

# Then in another terminal
python test_client.py
```

## Prerequisites

Make sure you have the required dependencies installed:

```bash
pip install pytest flask flask-cors
```

Or install from the requirements file:

```bash
pip install -r ../requirement.txt
```

## Test Structure

The tests are organized into two main classes:

1. **TestHumanEvalCommAPI** - Tests for the Flask API endpoints
2. **TestModels** - Tests for the data models and validation functions

Each test method is focused on a specific functionality and includes:
- Setup (using fixtures)
- Execution (API calls)
- Assertions (verifying responses)

## Fixtures

The test suite uses several pytest fixtures:

- `client` - Flask test client
- `sample_problem` - Sample problem data for testing
- `sample_batch_problems` - Sample batch problems for testing

## Mocking

Some tests use mocking to avoid external dependencies:
- Background worker tasks
- External API calls
- File system operations

## Continuous Integration

These tests can be easily integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    cd api
    python run_tests.py
```

## Adding New Tests

When adding new tests:

1. Follow the existing naming convention (`test_<functionality>`)
2. Use appropriate fixtures
3. Include both positive and negative test cases
4. Add docstrings explaining what the test does
5. Update this README if adding new test categories

## Troubleshooting

### Common Issues

1. **Import errors**: Make sure you're running tests from the correct directory
2. **Connection errors**: Ensure the API server isn't running on the same port during tests
3. **Missing dependencies**: Install pytest and other required packages

### Debug Mode

Run tests with more verbose output:

```bash
pytest test_api.py -v -s --tb=long
```

### Test Isolation

Each test is isolated and doesn't depend on others. If you need to run tests in a specific order, use pytest markers or fixtures.
