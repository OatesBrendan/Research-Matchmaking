import axios from 'axios';
import { navigate } from './navigationService';
console.log(process.env.REACT_APP_ENDPOINT);
const API_URL = process.env.REACT_APP_ENDPOINT || 'http://localhost:8080'

const apiClient = axios.create({
  withCredentials: true,
  baseURL: API_URL + '/api',
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url === '/users/refresh') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Attempting token refresh...');

        await apiClient.post('/users/refresh');

        console.log('Token refresh successful');

        processQueue(null);

        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('Token refresh failed');

        processQueue(refreshError);

        if (!originalRequest.url.includes('/users/refresh') &&
          !originalRequest.url.includes('/login') &&
          !originalRequest.url.includes('/check')) {
          navigate('/login');
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;