import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL || '';
let apiUrl = envApiUrl.trim();

if (apiUrl === '' || apiUrl.toLowerCase() === 'http://' || apiUrl.toLowerCase() === 'https://') {
  apiUrl = 'https://capstoneproject-bqso.onrender.com/api';
}

if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = 'https://capstoneproject-bqso.onrender.com/api';
}

const apiClient = axios.create({
  baseURL: apiUrl,
});

export default apiClient;
