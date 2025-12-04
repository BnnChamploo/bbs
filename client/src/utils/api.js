import axios from 'axios';
import apiLocal from './apiLocal';

// 根据环境变量决定使用真实 API 还是本地模拟 API
// 设置 VITE_USE_LOCAL_STORAGE=true 时使用 localStorage（纯前端模式）
const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

let api;

if (USE_LOCAL_STORAGE) {
  // 使用本地 localStorage API
  api = apiLocal;
} else {
  // 根据环境变量决定 API 地址
  // 开发环境使用代理，生产环境使用实际的后端 URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? '/api' : 'https://your-backend-url.railway.app/api');

  api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器：添加token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：处理错误
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 使用相对路径，兼容 GitHub Pages base path
        const basePath = import.meta.env.BASE_URL || '/';
        window.location.href = basePath + 'login';
      }
      return Promise.reject(error);
    }
  );
}

export default api;

