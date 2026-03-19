import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    const hide = message.loading('正在登录...', 0);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      hide();

      if (response.ok) {
        // --- 1. 存储登录状态和 Token ---
        localStorage.setItem('isLogin', 'true');
        localStorage.setItem('token', data.access_token);

        // --- 2. 核心修复：确保存储完整的用户信息 ---
        // 逻辑：如果后端 data.user 存在，则存储。
        // 注意：data.user 现在应该包含你在后端 UsersService 中补全的 roleName 字段了。
        if (data.user) {
          localStorage.setItem('userInfo', JSON.stringify(data.user));
        } else {
          // 如果后端没给 user 对象，说明后端接口可能需要检查
          console.warn('后端登录接口未返回完整的 user 信息');
          localStorage.setItem('userInfo', JSON.stringify({ 
            nickname: values.username, 
            roleName: '未知角色' 
          }));
        }

        message.success(`欢迎回来，${data.user?.nickname || values.username}`);

        // --- 3. 跳转 ---
        navigate('/dashboard', { replace: true });
        
      } else {
        message.error(data.message || '账号或密码错误');
      }
    } catch (error) {
      hide();
      message.error('网络请求失败，请检查后端服务');
    }
  };

  return (
    <div className="modern-app-canvas flex items-center justify-center">
      {/* 这里的背景光晕依赖于你 App.css 里的 .bg-glow 样式 */}
      <div className="bg-glow blob-1" />
      <div className="bg-glow blob-2" />
      
      <Card className="w-full max-w-[400px] border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl rounded-2xl z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#71ccbc] rounded-xl mx-auto mb-4 shadow-lg shadow-[#71ccbc]/30 flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-white rounded-sm rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-slate-700 tracking-tight">正达认证CRMV1.0</h1>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Supply Chain System V1.0</p>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="账号" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="密码" />
          </Form.Item>

          <Form.Item className="mt-8">
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full h-12 rounded-xl font-bold bg-[#71ccbc] hover:bg-[#5fb8a8] border-none"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}