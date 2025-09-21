import { useState, useEffect } from 'react';
import { Play, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiService } from '../services/api';

const SingleEvaluation = () => {
  const [formData, setFormData] = useState({
    dataset: 'HumanEval',
    model: 'gpt-3.5-turbo',
    problem_text: '',
    phase: 0,
    temperature: 1.0,
    topn: 1,
    option: 'original'
  });
  
  const [models, setModels] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiService.evaluateProblem(formData);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleProblems = [
    "Write a function that returns the sum of two numbers",
    "Write a function that finds the maximum value in a list",
    "Write a function that checks if a string is a palindrome",
    "Write a function that sorts a list of numbers in ascending order"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Single Problem Evaluation</h1>
        <p className="text-gray-600 mt-2">
          Evaluate a single coding problem using the HumanEvalComm API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Evaluation Parameters</h2>
          
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

            {/* Top N */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top N Responses
              </label>
              <input
                type="number"
                name="topn"
                min="1"
                max="10"
                value={formData.topn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option
              </label>
              <select
                name="option"
                value={formData.option}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="original">Original</option>
                <option value="manualRemove">Manual Remove</option>
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
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Evaluate Problem
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
                  <h3 className="text-sm font-medium text-green-800">Evaluation Complete</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Problem Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{result.problem_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Model</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{result.model}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dataset</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{result.dataset}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phase</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{result.phase}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Response</label>
                  <div className="relative">
                    <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                      {result.response}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(result.response)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated Code</label>
                  <div className="relative">
                    <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                      {result.code}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(result.code)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="text-center text-gray-500 py-8">
              <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Submit a problem to see evaluation results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleEvaluation;
