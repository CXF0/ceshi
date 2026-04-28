/**
 * @file src/pages/login/index.tsx
 * @desc 登录页 — 蓝色企业现代风格（对齐证优客官网）
 */
import React from 'react';
import { Form, Input, Button, message } from 'antd';
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
        localStorage.setItem('isLogin', 'true');
        localStorage.setItem('token', data.access_token);
        if (data.user) {
          localStorage.setItem('userInfo', JSON.stringify(data.user));
        } else {
          localStorage.setItem('userInfo', JSON.stringify({ nickname: values.username, roleName: '未知角色' }));
        }
        message.success(`欢迎回来，${data.user?.nickname || values.username}`);
        navigate('/dashboard', { replace: true });
      } else {
        message.error(data.message || '账号或密码错误');
      }
    } catch {
      hide();
      message.error('网络请求失败，请检查后端服务');
    }
  };

  return (
    <div
      className="modern-app-canvas flex items-center justify-center"
      style={{
        /* hero-mesh 渐变背景，与官网一致 */
        background: `
          radial-gradient(at 0% 0%,   hsla(225,100%,93%,1) 0, transparent 55%),
          radial-gradient(at 100% 0%, hsla(190,100%,92%,1) 0, transparent 55%),
          #f8faff
        `,
      }}
    >
      {/* 背景光晕 */}
      <div className="bg-glow blob-1" />
      <div className="bg-glow blob-2" />

      {/* 登录卡片 */}
      <div
        className="z-10 w-full"
        style={{
          maxWidth: 400,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(37,99,235,0.1)',
          borderRadius: 24,
          boxShadow: '0 8px 40px -8px rgba(37,99,235,0.14), 0 2px 8px rgba(0,0,0,0.04)',
          padding: '40px 36px 32px',
        }}
      >
        {/* Logo 区域 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* 蓝色方块 Logo（与官网同款设计语言） */}
          <div
            style={{
              width: 48, height: 48,
              background: '#2563eb',
              borderRadius: 14,
              margin: '0 auto 16px',
              boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* 内嵌小盾牌装饰 */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7l0 5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12L21 7 12 2z" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontStyle: 'italic',
              letterSpacing: '-0.03em',
              color: '#1e3a5f',
              margin: 0,
            }}
          >
            正达认证 CRM
          </h1>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#93aac9',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            Supply Chain System V1.0
          </p>
        </div>

        {/* 表单 */}
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]} style={{ marginBottom: 16 }}>
            <Input
              prefix={<UserOutlined style={{ color: '#93aac9' }} />}
              placeholder="账号"
              style={{
                borderRadius: 10,
                border: '1px solid rgba(37,99,235,0.12)',
                background: 'rgba(248,250,255,0.7)',
              }}
            />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} style={{ marginBottom: 24 }}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#93aac9' }} />}
              placeholder="密码"
              style={{
                borderRadius: 10,
                border: '1px solid rgba(37,99,235,0.12)',
                background: 'rgba(248,250,255,0.7)',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{
                height: 48,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '0.08em',
                background: '#2563eb',
                border: 'none',
                boxShadow: '0 6px 20px rgba(37,99,235,0.28)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        {/* 底部说明 */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 11,
            color: '#b8c8de',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          © 2026 正达认证平台 · 仅限授权用户登录
        </p>
      </div>
    </div>
  );
}