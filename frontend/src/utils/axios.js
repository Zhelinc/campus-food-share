import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // 后端地址不变
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器（加Token）—— 原代码没问题，保留
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

// 响应拦截器（处理错误）—— 核心修复
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 关键1：先判断是否是真正的401响应（排除网络错误、请求未发送的情况）
    if (error.response && error.response.status === 401) {
      // 关键2：增加防重复跳转（避免MyPublish和axios拦截器同时触发跳转）
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    }
    // 其他错误（500/404/网络错）只抛出，不删token、不跳转
    return Promise.reject(error);
  }
);

export default api;