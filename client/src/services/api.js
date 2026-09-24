import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token expiry globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response.data?.message || '';
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('not authorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login without full page reload if possible
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ---- Polls ----
export const pollAPI = {
  create: (data) => api.post('/polls', data),
  getAll: () => api.get('/polls'),
  getActive: () => api.get('/polls/active'),
  getArchive: () => api.get('/polls/archive'),
  getMy: () => api.get('/polls/my'),
  getById: (id) => api.get(`/polls/${id}`),
  close: (id) => api.put(`/polls/${id}/close`),
};

// ---- Votes ----
export const voteAPI = {
  cast: (pollId, optionId) => api.post(`/polls/${pollId}/vote`, { optionId }),
  getResults: (pollId) => api.get(`/polls/${pollId}/results`),
  getVoteStatus: (pollId) => api.get(`/polls/${pollId}/vote-status`),
};

export default api;
