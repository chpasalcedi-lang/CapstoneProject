import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL || '';
let apiUrl = envApiUrl.trim();

if (apiUrl === '' || apiUrl.toLowerCase() === 'http://' || apiUrl.toLowerCase() === 'https://') {
  apiUrl = 'https://capstoneproject-bqso.onrender.com/api';
}

if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = 'https://capstoneproject-bqso.onrender.com/api';
}

const fallbackApiUrl = 'https://capstoneproject-bqso.onrender.com/api';
const apiClient = axios.create({
  baseURL: apiUrl,
});

apiClient.interceptors.request.use((config) => {
  if (!config.baseURL || !/^https?:\/\//.test(config.baseURL) || config.baseURL.toLowerCase() === 'http://' || config.baseURL.toLowerCase() === 'https://') {
    config.baseURL = fallbackApiUrl;
  }

  if (typeof config.url === 'string') {
    const normalizedUrl = config.url.trim();

    if (/^https?:\/\/delete_room(\/.*)?$/i.test(normalizedUrl)) {
      config.url = normalizedUrl.replace(/^https?:\/\/delete_room/i, '/delete_room');
    } else if (/^delete_room(\/.*)?$/i.test(normalizedUrl)) {
      config.url = normalizedUrl.replace(/^delete_room/i, '/delete_room');
    } else {
      config.url = normalizedUrl;
    }
  }

  return config;
});

export default apiClient;
