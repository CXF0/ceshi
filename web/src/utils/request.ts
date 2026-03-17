import axios from 'axios';
import { message } from 'antd';

// 创建 axios 实例
const request = axios.create({
  // 💡 重要：根据你后端是否设置了 setGlobalPrefix('api') 来决定
  // 如果后端没设 api 前缀，这里就只写到 3000
  // baseURL: 'http://localhost:3000/api', 
  // 在 env 后面加个 (as any)
  baseURL: (import.meta as any).env.VITE_APP_API_URL || '/api',
  timeout: 5000,
});

// 请求拦截器：每发一个请求，自动把 localStorage 里的 token 塞进 Header
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // 确保这里的 key 和你登录存的一致
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误（比如登录过期）
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      message.error('身份认证失败，请重新登录');
      // 可以选在这里强制跳转回登录页
      // window.location.hash = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default request;