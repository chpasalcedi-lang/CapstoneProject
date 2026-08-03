import axios from 'axios';

const configuredApiUrl = typeof import.meta.env.VITE_API_URL === 'string'
  ? import.meta.env.VITE_API_URL.trim()
  : '';
const defaultApiUrl = typeof window !== 'undefined' && window.location.host
  ? `${window.location.protocol}//${window.location.host}/api`
  : '/api';
const apiUrl = configuredApiUrl || defaultApiUrl;

const apiClient = axios.create({
  baseURL: apiUrl,
});

// Expose the resolved base URL for easy debugging in the browser console
if (typeof window !== 'undefined') {
  window.__API_BASE = apiUrl;
  window.__API_URL = apiUrl;
}

export default apiClient;
