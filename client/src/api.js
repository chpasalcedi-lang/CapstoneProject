import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
export const API_URL = rawApiUrl.startsWith('http') ? rawApiUrl : rawApiUrl;

const apiClient = axios.create({
  baseURL: API_URL,
});

export default apiClient;
