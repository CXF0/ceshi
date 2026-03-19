import axios from 'axios';
import { message } from 'antd';
// 💡 1. 引入 nprogress 及其样式
import nprogress from 'nprogress';
import 'nprogress/nprogress.css';

// 💡 2. 简单配置（隐藏右上角圈圈，调快速度）
nprogress.configure({ showSpinner: false, speed: 400 });

// 创建 axios 实例
const request = axios.create({
  baseURL: (import.meta as any).env.VITE_APP_API_URL || '/api',
  timeout: 5000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 🚀 3. 开始显示进度条
    nprogress.start();

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // ❌ 发生错误也需要结束进度条
    nprogress.done();
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // ✅ 4. 响应成功，结束进度条
    nprogress.done();
    return response;
  },
  (error) => {
    // 💡 5. 无论什么错误，都要关闭进度条
    nprogress.done();

    if (error.response?.status === 401) {
      message.error('身份认证失败，请重新登录');
      // localStorage.removeItem('token'); // 建议认证失败清理一下旧 token
      // window.location.hash = '/login'; 
    } else if (error.response?.status === 500) {
      message.error('服务器开小差了，请稍后再试');
    }
    
    return Promise.reject(error);
  }
);

export default request;