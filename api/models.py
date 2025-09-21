
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum

class DatasetType(Enum):
    HUMANEVAL = "HumanEval"
    HUMANEVALCOMM = "HumanEvalComm"

class ModelType(Enum):
    GPT35_TURBO = "gpt-3.5-turbo"
    GPT4 = "gpt-4"
    OKANAGAN = "Okanagan"
    AGENTCODER = "AgentCoder"

class EvaluationPhase(Enum):
    INITIAL_RESPONSE = 0
    QUESTION_EVALUATION = 1
    SECOND_ROUND = 2
    CODE_EXTRACTION = 3
    METRICS_COMPUTATION = 4
    AGGREGATION = 5
    CATEGORY_ANALYSIS = 6

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class Problem:
    name: str
    text: str
    entry_point: Optional[str] = None
    test_cases: Optional[List[str]] = None

@dataclass
class EvaluationRequest:
    dataset: str
    model: str
    problem_text: str
    phase: int = 0
    temperature: float = 1.0
    topn: int = 1
    option: str = "original"
    min_problem_idx: int = -1
    max_num_problems: int = -1

@dataclass
class EvaluationResponse:
    dataset: str
    model: str
    phase: int
    problem_name: str
    response: str
    code: str
    question_quality: str
    answer: str
    timestamp: str

@dataclass
class BatchEvaluationRequest:
    dataset: str
    model: str
    problems: List[Problem]
    phase: int = 0
    temperature: float = 1.0
    topn: int = 1
    option: str = "original"

@dataclass
class BatchEvaluationResponse:
    dataset: str
    model: str
    total_problems: int
    results: List[EvaluationResponse]
    timestamp: str

@dataclass
class TaskInfo:
    task_id: str
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

def validate_evaluation_request(data: Dict[str, Any]) -> List[str]:
    errors = []
    
    required_fields = ['dataset', 'model', 'problem_text']
    for field in required_fields:
        if field not in data:
            errors.append(f'Missing required field: {field}')
    
    if 'dataset' in data and data['dataset'] not in [d.value for d in DatasetType]:
        errors.append(f'Invalid dataset. Must be one of: {[d.value for d in DatasetType]}')
    
    if 'model' in data and data['model'] not in [m.value for m in ModelType]:
        errors.append(f'Invalid model. Must be one of: {[m.value for m in ModelType]}')
    
    if 'phase' in data:
        try:
            phase = int(data['phase'])
            if phase < 0 or phase > 6:
                errors.append('Phase must be between 0 and 6')
        except (ValueError, TypeError):
            errors.append('Phase must be an integer')
    
    if 'temperature' in data:
        try:
            temp = float(data['temperature'])
            if temp < 0 or temp > 2:
                errors.append('Temperature must be between 0 and 2')
        except (ValueError, TypeError):
            errors.append('Temperature must be a number')
    
    if 'topn' in data:
        try:
            topn = int(data['topn'])
            if topn < 1 or topn > 10:
                errors.append('topn must be between 1 and 10')
        except (ValueError, TypeError):
            errors.append('topn must be an integer')
    
    return errors

def validate_batch_request(data: Dict[str, Any]) -> List[str]:
    errors = validate_evaluation_request(data)
    
    if 'problems' in data:
        if not isinstance(data['problems'], list):
            errors.append('problems must be a list')
        elif len(data['problems']) == 0:
            errors.append('problems list cannot be empty')
        elif len(data['problems']) > 100:
            errors.append('Maximum 100 problems allowed per batch')
        else:
            for i, problem in enumerate(data['problems']):
                if not isinstance(problem, dict):
                    errors.append(f'Problem {i} must be a dictionary')
                elif 'name' not in problem or 'text' not in problem:
                    errors.append(f'Problem {i} missing name or text field')
    
    return errors
