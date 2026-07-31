import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('campuscare_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    // Automatically retry GET requests up to 3 times with exponential backoff if they fail due to a timeout or network error
    if (config && config.method === 'get' && (error.code === 'ECONNABORTED' || !error.response)) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < 3) {
        config.__retryCount += 1;
        const delay = config.__retryCount * 1000;
        console.warn(`[Axios] Request to ${config.url} failed or timed out. Retrying (attempt ${config.__retryCount}/3) in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    if (error.response?.status === 401) {
      sessionStorage.removeItem('campuscare_token');
      sessionStorage.removeItem('campuscare_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => error.response?.data?.message || error.message || 'Request failed.';
export default api;
