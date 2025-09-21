import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Play, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiService } from '../services/api';

const BatchEvaluation = () => {
  const [formData, setFormData] = useState({
    dataset: 'HumanEval',
    model: 'gpt-3.5-turbo',
    phase: 0,
    temperature: 1.0
  });
  
  const [problems, setProblems] = useState([
    { name: '', text: '' }
  ]);
  
  const [models, setModels] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleProblemChange = (index, field, value) => {
    const newProblems = [...problems];
    newProblems[index][field] = value;
    setProblems(newProblems);
  };

  const addProblem = () => {
    setProblems([...problems, { name: '', text: '' }]);
  };

  const removeProblem = (index) => {
    if (problems.length > 1) {
      const newProblems = problems.filter((_, i) => i !== index);
      setProblems(newProblems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const validProblems = problems.filter(p => p.name.trim() && p.text.trim());
    if (validProblems.length === 0) {
      setError('Please add at least one problem with both name and text');
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        ...formData,
        problems: validProblems
      };
      
      const response = await apiService.evaluateBatch(requestData);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleProblems = [
    { name: 'add_numbers', text: 'Write a function that adds two numbers' },
    { name: 'find_max', text: 'Write a function that finds the maximum value in a list' },
    { name: 'is_palindrome', text: 'Write a function that checks if a string is a palindrome' },
    { name: 'sort_list', text: 'Write a function that sorts a list of numbers in ascending order' },
    { name: 'factorial', text: 'Write a function that calculates the factorial of a number' }
  ];

  const loadSampleProblems = () => {
    setProblems(sampleProblems);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Batch Evaluation</h1>
        <p className="text-gray-600 mt-2">
          Evaluate multiple coding problems in a single request
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Batch Parameters</h2>
          
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

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {formData.temperature}
              </label>
              <input
                type="range"
                name="temperature"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>

            {/* Problems */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Problems ({problems.length})
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={loadSampleProblems}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Load Samples
                  </button>
                  <button
                    type="button"
                    onClick={addProblem}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Add Problem
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {problems.map((problem, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Problem {index + 1}
                      </span>
                      {problems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProblem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <input
                          type="text"
                          placeholder="Problem name"
                          value={problem.name}
                          onChange={(e) => handleProblemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                      </div>
                      
                      <div>
                        <textarea
                          placeholder="Problem description"
                          value={problem.text}
                          onChange={(e) => handleProblemChange(index, 'text', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || problems.every(p => !p.name.trim() || !p.text.trim())}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Evaluate Batch ({problems.filter(p => p.name.trim() && p.text.trim()).length} problems)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
          
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

          {result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">
                    Batch Evaluation Complete
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dataset</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{result.dataset}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Model</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{result.model}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Problems</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{result.total_problems}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {result.results.map((problemResult, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {problemResult.problem_name}
                        </h4>
                        
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Response</label>
                            <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded overflow-x-auto">
                              {problemResult.response}
                            </pre>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Code</label>
                            <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded overflow-x-auto">
                              {problemResult.code}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="text-center text-gray-500 py-8">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Submit a batch of problems to see evaluation results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchEvaluation;
