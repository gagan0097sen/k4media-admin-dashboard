import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // For FormData, let axios set the correct Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const authService = {
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  logout: () =>
    api.post('/auth/logout'),
};

export const imageService = {
  uploadImage: (formData) =>
    api.post('/images/upload', formData),
  getMyImages: () =>
    api.get('/images/admin/my-images'),
  deleteImage: (imageId) =>
    api.delete(`/images/${imageId}`),
  updateImage: (imageId, data) =>
    api.put(`/images/${imageId}`, data),
  getAllImages: () =>
    api.get('/images'),
};

export default api;
