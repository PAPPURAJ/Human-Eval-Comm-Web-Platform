import { useState, useEffect } from 'react';
import { Info, Database, Cpu, Clock, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { apiService } from '../services/api';

const ApiInfo = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [models, setModels] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [phases, setPhases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchApiInfo = async () => {
      try {
        setLoading(true);
        const [health, modelsData, datasetsData, phasesData] = await Promise.all([
          apiService.healthCheck(),
          apiService.getModels(),
          apiService.getDatasets(),
          apiService.getPhases()
        ]);
        
        setHealthStatus(health);
        setModels(modelsData);
        setDatasets(datasetsData);
        setPhases(phasesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApiInfo();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/health',
      description: 'Check API server health status',
      example: 'curl http://localhost:5000/health'
    },
    {
      method: 'GET',
      path: '/api/v1/models',
      description: 'Get available models',
      example: 'curl http://localhost:5000/api/v1/models'
    },
    {
      method: 'GET',
      path: '/api/v1/datasets',
      description: 'Get available datasets',
      example: 'curl http://localhost:5000/api/v1/datasets'
    },
    {
      method: 'GET',
      path: '/api/v1/phases',
      description: 'Get evaluation phases',
      example: 'curl http://localhost:5000/api/v1/phases'
    },
    {
      method: 'POST',
      path: '/api/v1/evaluate',
      description: 'Evaluate single problem',
      example: `curl -X POST http://localhost:5000/api/v1/evaluate \\
  -H "Content-Type: application/json" \\
  -d '{"dataset": "HumanEval", "model": "gpt-3.5-turbo", "problem_text": "Write a function that adds two numbers"}'`
    },
    {
      method: 'POST',
      path: '/api/v1/evaluate/async',
      description: 'Start async evaluation',
      example: `curl -X POST http://localhost:5000/api/v1/evaluate/async \\
  -H "Content-Type: application/json" \\
  -d '{"dataset": "HumanEvalComm", "model": "gpt-3.5-turbo", "problem_text": "Write a function that processes strings"}'`
    },
    {
      method: 'GET',
      path: '/api/v1/tasks/{task_id}',
      description: 'Get task status',
      example: 'curl http://localhost:5000/api/v1/tasks/task_1234567890'
    },
    {
      method: 'POST',
      path: '/api/v1/evaluate/batch',
      description: 'Evaluate multiple problems',
      example: `curl -X POST http://localhost:5000/api/v1/evaluate/batch \\
  -H "Content-Type: application/json" \\
  -d '{"dataset": "HumanEval", "model": "gpt-3.5-turbo", "problems": [{"name": "add", "text": "Add two numbers"}]}'`
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Information</h1>
        <p className="text-gray-600 mt-2">
          Complete information about the HumanEvalComm API endpoints and capabilities
        </p>
      </div>

      {/* API Status */}
      {healthStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
                <p className="text-sm text-gray-500 capitalize">{healthStatus.status}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Info className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Version</h3>
                <p className="text-sm text-gray-500">v{healthStatus.version}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Last Updated</h3>
                <p className="text-sm text-gray-500">
                  {new Date(healthStatus.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Models */}
        {models && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Models</h2>
            <div className="space-y-4">
              {Object.entries(models).map(([category, modelList]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium text-gray-800 capitalize mb-2">
                    {category} ({modelList.length})
                  </h3>
                  <div className="space-y-1">
                    {modelList.map(model => (
                      <div key={model} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700 font-mono">{model}</span>
                        <Cpu className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Datasets */}
        {datasets && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Datasets</h2>
            <div className="space-y-4">
              {Object.entries(datasets).map(([name, info]) => (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-800">{name}</h3>
                    <Database className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{info.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Problems: {info.problems}</span>
                    <span className="text-gray-500 capitalize">Type: {info.type}</span>
                  </div>
                  {info.categories && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Categories: </span>
                      <span className="text-sm text-gray-700">
                        {info.categories.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Phases */}
      {phases && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Evaluation Phases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(phases).map(([phaseId, phaseInfo]) => (
              <div key={phaseId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-800">
                    Phase {phaseId}
                  </h3>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  {phaseInfo.name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {phaseInfo.description}
                </p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Output:</span> {phaseInfo.output}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Endpoints */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    endpoint.method === 'GET' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-gray-800">
                    {endpoint.path}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(endpoint.example)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Copy example"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
              <div className="bg-gray-50 rounded p-3">
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  {endpoint.example}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Python Client</h3>
            <div className="bg-gray-50 rounded p-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
{`import requests

# Health check
response = requests.get('http://localhost:5000/health')
print(response.json())

# Evaluate a problem
data = {
    "dataset": "HumanEval",
    "model": "gpt-3.5-turbo",
    "problem_text": "Write a function that adds two numbers",
    "phase": 0
}
response = requests.post('http://localhost:5000/api/v1/evaluate', json=data)
print(response.json())`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">JavaScript Client</h3>
            <div className="bg-gray-50 rounded p-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
{`fetch('http://localhost:5000/health')
  .then(response => response.json())
  .then(data => console.log(data));

const data = {
  dataset: 'HumanEval',
  model: 'gpt-3.5-turbo',
  problem_text: 'Write a function that adds two numbers',
  phase: 0
};

fetch('http://localhost:5000/api/v1/evaluate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(response => response.json())
.then(data => console.log(data));`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiInfo;
