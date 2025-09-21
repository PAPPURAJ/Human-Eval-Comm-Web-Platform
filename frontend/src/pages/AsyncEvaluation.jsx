import { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

const AsyncEvaluation = () => {
  const [formData, setFormData] = useState({
    dataset: 'HumanEvalComm',
    model: 'gpt-3.5-turbo',
    problem_text: '',
    phase: 0
  });
  
  const [models, setModels] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modelsData, datasetsData] = await Promise.all([
          apiService.getModels(),
          apiService.getDatasets()
        ]);
        setModels(modelsData);
        setDatasets(datasetsData);
      } catch (err) {
        setError('Failed to load API data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let interval;
    if (polling && taskId) {
      interval = setInterval(async () => {
        try {
          const status = await apiService.getTaskStatus(taskId);
          setTaskStatus(status);
          
          if (status.status === 'completed' || status.status === 'failed') {
            setPolling(false);
          }
        } catch (err) {
          console.error('Error polling task status:', err);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, taskId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTaskStatus(null);

    try {
      const response = await apiService.evaluateProblemAsync(formData);
      setTaskId(response.task_id);
      setPolling(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!taskId) return;
    
    try {
      const status = await apiService.getTaskStatus(taskId);
      setTaskStatus(status);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'running': return Loader;
      case 'completed': return CheckCircle;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const sampleProblems = [
    "Write a function that processes a list of strings and returns the longest one",
    "Create a function that validates email addresses using regex",
    "Implement a function that finds the intersection of two arrays",
    "Write a function that converts a nested dictionary to a flat dictionary"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Async Evaluation</h1>
        <p className="text-gray-600 mt-2">
          Start background evaluation tasks and monitor their progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Start Async Task</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dataset */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dataset
              </label>
              <select
                name="dataset"
                value={formData.dataset}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {datasets && Object.keys(datasets).map(dataset => (
                  <option key={dataset} value={dataset}>
                    {dataset} ({datasets[dataset].problems} problems)
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {models && Object.entries(models).map(([category, modelList]) => (
                  <optgroup key={category} label={category}>
                    {modelList.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Problem Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Description
              </label>
              <textarea
                name="problem_text"
                value={formData.problem_text}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter the coding problem description..."
                required
              />
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">Sample problems:</p>
                <div className="space-y-1">
                  {sampleProblems.map((problem, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, problem_text: problem }))}
                      className="block text-sm text-primary-600 hover:text-primary-800 text-left"
                    >
                      {problem}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Phase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evaluation Phase
              </label>
              <select
                name="phase"
                value={formData.phase}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={0}>Phase 0: Initial Response</option>
                <option value={1}>Phase 1: Question Evaluation</option>
                <option value={2}>Phase 2: Second Round</option>
                <option value={3}>Phase 3: Code Extraction</option>
                <option value={4}>Phase 4: Metrics Computation</option>
                <option value={5}>Phase 5: Aggregation</option>
                <option value={6}>Phase 6: Category Analysis</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.problem_text}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Starting Task...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Async Task
                </>
              )}
            </button>
          </form>
        </div>

        {/* Task Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Task Status</h2>
            {taskId && (
              <button
                onClick={checkStatus}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Refresh status"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {taskId && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task ID</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                  {taskId}
                </p>
              </div>

              {taskStatus && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(taskStatus.status)}`}>
                      {(() => {
                        const Icon = getStatusIcon(taskStatus.status);
                        return <Icon className={`h-4 w-4 mr-2 ${taskStatus.status === 'running' ? 'animate-spin' : ''}`} />;
                      })()}
                      {taskStatus.status.charAt(0).toUpperCase() + taskStatus.status.slice(1)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(taskStatus.created_at).toLocaleString()}
                    </p>
                  </div>

                  {taskStatus.started_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Started At</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {new Date(taskStatus.started_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {taskStatus.completed_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Completed At</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {new Date(taskStatus.completed_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {taskStatus.error && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Error</label>
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {taskStatus.error}
                      </p>
                    </div>
                  )}

                  {taskStatus.result && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">Result</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dataset</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {taskStatus.result.dataset}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Model</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {taskStatus.result.model}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Response</label>
                        <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                          {taskStatus.result.response}
                        </pre>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Generated Code</label>
                        <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                          {taskStatus.result.code}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}

              {polling && (
                <div className="text-center text-blue-600">
                  <Loader className="animate-spin h-4 w-4 mx-auto mb-2" />
                  <p className="text-sm">Polling for updates...</p>
                </div>
              )}
            </div>
          )}

          {!taskId && !error && (
            <div className="text-center text-gray-500 py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Start an async task to see status updates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsyncEvaluation;
