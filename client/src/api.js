import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

export default apiClient;
