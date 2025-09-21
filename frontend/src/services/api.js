import axios from 'axios';

const API_BASE_URL = 'https://api.humanevalcomm.pappuraj.com/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  getModels: async () => {
    const response = await api.get('/api/v1/models');
    return response.data;
  },

  getDatasets: async () => {
    const response = await api.get('/api/v1/datasets');
    return response.data;
  },

  getPhases: async () => {
    const response = await api.get('/api/v1/phases');
    return response.data;
  },

  evaluateProblem: async (data) => {
    const response = await api.post('/api/v1/evaluate', data);
    return response.data;
  },

  evaluateProblemAsync: async (data) => {
    const response = await api.post('/api/v1/evaluate/async', data);
    return response.data;
  },

  getTaskStatus: async (taskId) => {
    const response = await api.get(`/api/v1/tasks/${taskId}`);
    return response.data;
  },

  evaluateBatch: async (data) => {
    const response = await api.post('/api/v1/evaluate/batch', data);
    return response.data;
  },
};

export default api;
