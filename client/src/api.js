import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

axios.defaults.baseURL = baseURL;
axios.defaults.timeout = 20000;

axios.interceptors.request.use((config) => {
  if (config.url?.startsWith('http://localhost:3001')) {
    config.url = config.url.replace('http://localhost:3001', '');
  }
  return config;
});

const api = axios.create({
  baseURL,
  timeout: 20000,
});

export default api;
