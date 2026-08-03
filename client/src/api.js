import axios from 'axios';

let rawApiUrl = import.meta.env.VITE_API_URL;
if (!rawApiUrl || rawApiUrl.trim() === '' || rawApiUrl.trim().toLowerCase() === 'https://' || rawApiUrl.trim().toLowerCase() === 'http://') {
  rawApiUrl = 'https://capstoneproject-bqso.onrender.com/api';
}
const API_URL = rawApiUrl;

const apiClient = axios.create({
  baseURL: API_URL,
});

export default apiClient;
