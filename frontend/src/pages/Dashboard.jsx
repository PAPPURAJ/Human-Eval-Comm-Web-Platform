import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Clock, 
  Layers, 
  Info,
  CheckCircle,
  AlertCircle,
  Activity,
  Database,
  Cpu
} from 'lucide-react';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [models, setModels] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [health, modelsData, datasetsData] = await Promise.all([
          apiService.healthCheck(),
          apiService.getModels(),
          apiService.getDatasets()
        ]);
        
        setHealthStatus(health);
        setModels(modelsData);
        setDatasets(datasetsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Single Evaluation',
      description: 'Test a single coding problem',
      icon: Play,
      href: '/single',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Async Evaluation',
      description: 'Start background evaluation task',
      icon: Clock,
      href: '/async',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Batch Evaluation',
      description: 'Evaluate multiple problems',
      icon: Layers,
      href: '/batch',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'API Information',
      description: 'View available models and datasets',
      icon: Info,
      href: '/info',
      color: 'bg-orange-500 hover:bg-orange-600'
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
            <p className="text-sm text-red-600 mt-1">
              Make sure the API server is running on http://localhost:5000
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          HumanEvalComm API Testing and Evaluation Platform
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">API Status</h3>
              <p className="text-sm text-gray-500">
                {healthStatus?.status === 'healthy' ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Cpu className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Available Models</h3>
              <p className="text-sm text-gray-500">
                {models ? Object.values(models).flat().length : 0} models
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Datasets</h3>
              <p className="text-sm text-gray-500">
                {datasets ? Object.keys(datasets).length : 0} datasets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* API Information Summary */}
      {healthStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Server Status
              </h3>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-900">
                  {healthStatus.status} (v{healthStatus.version})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
              </p>
            </div>
            
            {models && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Available Models
                </h3>
                <div className="space-y-1">
                  {Object.entries(models).map(([category, modelList]) => (
                    <div key={category} className="text-sm">
                      <span className="font-medium text-gray-900 capitalize">
                        {category}:
                      </span>
                      <span className="text-gray-600 ml-1">
                        {modelList.length} models
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
