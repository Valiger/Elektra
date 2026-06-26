import { useState, useCallback } from 'react';
import axios from 'axios';

// Ensure we have a valid base URL for the backend
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL,
  headers: {
    'Bypass-Tunnel-Reminder': 'true'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('elektra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/login' && originalRequest.url !== '/api/auth/refresh') {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('elektra_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${baseURL}/api/auth/refresh`, 
            { refresh_token: refreshToken },
            { headers: { 'Bypass-Tunnel-Reminder': 'true' } }
          );
          localStorage.setItem('elektra_token', res.data.access_token);
          localStorage.setItem('elektra_refresh_token', res.data.refresh_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login if necessary
          localStorage.removeItem('elektra_token');
          localStorage.removeItem('elektra_refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading, error };
};

export default api;
