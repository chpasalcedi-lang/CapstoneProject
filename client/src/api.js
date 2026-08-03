import axios from 'axios';

const apiUrl = 'https://capstoneproject-bqso.onrender.com/api';
const apiClient = axios.create({
  baseURL: apiUrl,
});

export default apiClient;
