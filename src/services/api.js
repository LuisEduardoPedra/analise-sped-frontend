import axios from 'axios';

const api = axios.create({
  baseURL: 'https://analisador-api-service-861393614978.southamerica-east1.run.app/api/v1',
});

api.interceptors.request.use(async config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;