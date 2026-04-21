// ============================================================
// LearnSpace - API Service (Axios)
// ============================================================
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export const resolveEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
};

const assertId = (value, label = 'id') => {
  const id = resolveEntityId(value);

  if (!id || id === 'undefined' || id === 'null') {
    throw new Error(`A valid ${label} is required.`);
  }

  return id;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('learnspace-auth') || '{}');
    const token = auth?.state?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 / token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const auth = JSON.parse(localStorage.getItem('learnspace-auth') || '{}');
        const refreshToken = auth?.state?.refreshToken;

        if (!refreshToken) {
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Use the same baseURL as main api instance (not hardcoded /api path)
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const res = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });

        // Backend sends: { success, data: { accessToken, refreshToken } }
        const payload = res.data?.data || res.data;
        const newToken = payload.accessToken || payload.token;

        if (!newToken) {
          throw new Error('No token in refresh response');
        }

        const stored = JSON.parse(localStorage.getItem('learnspace-auth') || '{}');
        if (stored?.state) {
          stored.state.token = newToken;
          if (payload.refreshToken) {
            stored.state.refreshToken = payload.refreshToken;
          }
          localStorage.setItem('learnspace-auth', JSON.stringify(stored));
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('learnspace-auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Course API helpers
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getFeatured: () => api.get('/courses/featured'),
  getRecommendations: (params) => api.get('/courses/recommendations', { params }),
  getOne: (id) => api.get(`/courses/${assertId(id, 'course id')}`),

  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${assertId(id, 'course id')}`, data),

  submit: (id) => api.post(`/courses/${assertId(id, 'course id')}/submit`),
  submitForReview: (id) => api.post(`/courses/${assertId(id, 'course id')}/submit`),
  delete: (id) => api.delete(`/courses/${assertId(id, 'course id')}`),
  getMine: (params) => api.get('/courses/instructor/my-courses', { params })
};

// Payment API helpers
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  confirmStripe: (data) => api.post('/payments/stripe/confirm', data),
  initSslcommerz: (data) => api.post('/payments/sslcommerz/init', data),
  getSslcommerzStatus: () => api.get('/payments/sslcommerz/status'),
  getHistory: (params) => api.get('/payments/history', { params })
};

// Chatbot API helpers
export const chatbotAPI = {
  send: (message) => api.post('/chatbot/message', { message })
};

// Review API helpers
export const reviewAPI = {
  list:   (courseId) => api.get(`/reviews/course/${assertId(courseId, 'course id')}`),
  mine:   (courseId) => api.get(`/reviews/my/${assertId(courseId, 'course id')}`),
  save:   (courseId, data) => api.post(`/reviews/${assertId(courseId, 'course id')}`, data),
  remove: (courseId) => api.delete(`/reviews/${assertId(courseId, 'course id')}`)
};

// Messaging API helpers
export const messageAPI = {
  conversations: () => api.get('/messages/conversations'),
  thread:        (userId) => api.get(`/messages/thread/${assertId(userId, 'user id')}`),
  send:          (data) => api.post('/messages', data),
  unreadCount:   () => api.get('/messages/unread-count')
};

// Live Class API helpers
export const liveClassAPI = {
  forCourse: (courseId) => api.get(`/live-classes/course/${assertId(courseId, 'course id')}`),
  create:    (data) => api.post('/live-classes', data),
  update:    (id, data) => api.patch(`/live-classes/${assertId(id, 'class id')}`, data),
  remove:    (id) => api.delete(`/live-classes/${assertId(id, 'class id')}`)
};

// Progress API helpers
export const progressAPI = {
  markComplete: (lessonId, data) => api.post(`/progress/lesson/${assertId(lessonId, 'lesson id')}`, data),
  getCourseProgress: (courseId) => api.get(`/progress/course/${assertId(courseId, 'course id')}`),
  updatePosition: (lessonId, data) => api.patch(`/progress/lesson/${assertId(lessonId, 'lesson id')}/position`, data)
};

// Certificate API helpers
export const certAPI = {
  generate: (courseId) => api.post(`/certificates/generate/${assertId(courseId, 'course id')}`),
  verify: (hash) => api.get(`/certificates/verify/${hash}`),
  getMine: () => api.get('/certificates/my')
};

// Admin API helpers
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingInstructors: () => api.get('/admin/instructors/pending'),
  verifyInstructor: (id, data) => api.patch(`/admin/instructors/${assertId(id, 'instructor id')}/verify`, data),
  getPendingCourses: () => api.get('/admin/courses/pending'),
  reviewCourse: (id, data) => api.patch(`/admin/courses/${assertId(id, 'course id')}/review`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.patch(`/admin/users/${assertId(id, 'user id')}/toggle`),
  getRevenue: (params) => api.get('/admin/reports/revenue', { params })
};
