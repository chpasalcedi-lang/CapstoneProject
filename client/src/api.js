import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');
const apiClient = axios.create({
  baseURL: apiUrl,
});

export default apiClient;
