import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '../types/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;
const API_KEY = 'telegram-automation-key-2025';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };

    if (error.response) {
      // Server responded with error status
      apiError.message = error.response.data?.message || error.response.data?.detail || error.message;
      apiError.code = error.response.data?.code || `HTTP_${error.response.status}`;
      apiError.details = error.response.data;
    } else if (error.request) {
      // Request made but no response received
      apiError.message = 'Network error - please check your connection';
      apiError.code = 'NETWORK_ERROR';
    } else {
      // Error in request configuration
      apiError.message = error.message;
      apiError.code = 'REQUEST_ERROR';
    }

    return Promise.reject(apiError);
  }
);

// API helper functions
export const api = {
  // Generic methods
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get(url, config).then(res => res.data),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post(url, data, config).then(res => res.data),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put(url, data, config).then(res => res.data),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete(url, config).then(res => res.data),

  // Health & Status
  health: () => api.get('/health'),
  
  // Authentication
  auth: {
    status: () => api.get('/auth/status'),
    configuration: () => api.get('/auth/configuration'),
    configure: (data: { api_id: number; api_hash: string }) => 
      api.post('/auth/configure', data),
    phone: (phone: string) => api.post('/auth/phone', { phone }),
    verify: (data: { phone: string; code: string }) => 
      api.post('/auth/verify', data),
    twoFactor: (data: { password: string }) => 
      api.post('/auth/2fa', data),
  },

  // Groups
  groups: {
    list: () => api.get('/groups'),
    add: (link: string) => api.post('/groups', { link }),
    remove: (link: string) => api.delete(`/groups/${encodeURIComponent(link)}`),
  },

  // Messages
  messages: {
    list: () => api.get('/messages'),
    get: (filename: string) => api.get(`/messages/${filename}`),
    create: (data: { filename: string; content: string }) => 
      api.post('/messages', data),
    update: (filename: string, content: string) => 
      api.put(`/messages/${filename}`, { content }),
    delete: (filename: string) => api.delete(`/messages/${filename}`),
  },

  // Templates
  templates: {
    list: () => api.get('/templates'),
    create: (data: { name: string; content: string }) => 
      api.post('/templates', data),
    delete: (name: string) => api.delete(`/templates/${name}`),
  },

  // Blacklist
  blacklist: {
    list: () => api.get('/blacklist'),
    addPermanent: (link: string, reason?: string) => 
      api.post('/blacklist/permanent', { link, reason }),
    addTemporary: (link: string, duration: number, reason?: string) => 
      api.post('/blacklist/temporary', { link, duration, reason }),
    remove: (link: string) => api.delete(`/blacklist/${encodeURIComponent(link)}`),
  },

  // Configuration
  config: {
    get: () => api.get('/config'),
    updateTelegram: (data: { api_id: number; api_hash: string }) => 
      api.post('/config/telegram', data),
    updateDelays: (data: any) => api.post('/config/delays', data),
    updateSafety: (data: any) => api.post('/config/safety', data),
  },

  // Logs
  logs: {
    list: (params?: { level?: string; component?: string; limit?: number }) => 
      api.get('/logs', { params }),
    download: () => api.get('/logs/download'),
  },

  // WebSocket
  websocket: {
    connections: () => api.get('/ws/connections'),
    broadcast: (message: any) => api.post('/ws/broadcast', message),
    log: (data: any) => api.post('/ws/log', data),
  },

  // Tasks
  tasks: {
    list: (params?: { status?: string; type?: string }) => 
      api.get('/tasks', { params }),
    get: (id: string) => api.get(`/tasks/${id}`),
    create: (type: string, data: any) => api.post(`/tasks/${type}`, data),
    cancel: (id: string) => api.post(`/tasks/${id}/cancel`),
    stats: () => api.get('/tasks/stats/overview'),
  },
};

export default apiClient;