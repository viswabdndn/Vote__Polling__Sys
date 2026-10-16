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
  update: (id, data) => api.put(`/polls/${id}`, data),
  close: (id) => api.put(`/polls/${id}/close`),
  toggleStatus: (id) => api.put(`/polls/${id}/status`),
  delete: (id) => api.delete(`/polls/${id}`),
};

// ---- Admin API ----
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getCreators: () => api.get('/admin/creators'),
  createCreator: (data) => api.post('/admin/creators', data),
  updateCreatorStatus: (id, isActive) => api.put(`/admin/creators/${id}/status`, { isActive }),
  updateCreatorPermissions: (id, permissions) => api.put(`/admin/creators/${id}/permissions`, permissions),
  deleteCreator: (id) => api.delete(`/admin/creators/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPolls: () => api.get('/admin/polls'),
  getPendingPolls: () => api.get('/admin/polls/pending'),
  approvePoll: (id, data) => api.put(`/admin/polls/${id}/approve`, data || {}),
  rejectPoll: (id, reason) => api.put(`/admin/polls/${id}/reject`, { reason }),
  deletePoll: (id) => api.delete(`/polls/${id}`), // reuse poll delete which allows admin
};

// ---- Votes ----
export const voteAPI = {
  cast: (pollId, optionId) => api.post(`/polls/${pollId}/vote`, { optionId }),
  getResults: (pollId) => api.get(`/polls/${pollId}/results`),
  getParticipants: (pollId) => api.get(`/polls/${pollId}/participants`),
  getVoteStatus: (pollId) => api.get(`/polls/${pollId}/vote-status`),
};

export default api;
