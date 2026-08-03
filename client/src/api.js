import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');
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
