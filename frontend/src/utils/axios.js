import axios from 'axios';

// 根据环境变量设置 baseURL
const baseURL = import.meta.env.PROD
  ? 'https://campus-food-api.zeabur.app'   // 生产环境：Zeabur 后端域名
  : 'http://localhost:8080';                // 开发环境：本地后端

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器（加Token）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器（处理错误）
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;