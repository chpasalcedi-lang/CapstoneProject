import axios from 'axios';

const configuredApiUrl = typeof import.meta.env.VITE_API_URL === 'string'
  ? import.meta.env.VITE_API_URL.trim()
  : '';
const isLocalDevelopment = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);
const apiUrl = isLocalDevelopment || !configuredApiUrl ? '/api' : configuredApiUrl;

const apiClient = axios.create({
  baseURL: apiUrl,
});

// Expose the resolved base URL for easy debugging in the browser console
if (typeof window !== 'undefined') {
  try {
    /// eslint-disable-next-line no-undef
    window.__API_BASE = apiClient.defaults && apiClient.defaults.baseURL ? apiClient.defaults.baseURL : apiUrl;
  } catch (err) {
    console.error('Error setting window.__API_BASE:', err);
    // ignore
  }
}

export default apiClient;
