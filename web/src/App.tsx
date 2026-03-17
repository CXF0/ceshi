/**
 * @file src/App.tsx
 * @version 2.2.2 [2026-03-13]
 * @desc 彻底解决独立页面跳转首页问题：优化路由权重与独立页面权限校验。
 */
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import {
  UserOutlined, LogoutOutlined, BellOutlined, MenuFoldOutlined, 
  MenuUnfoldOutlined, HomeOutlined
} from '@ant-design/icons';
import {
  Layout, ConfigProvider, Button, Space, Badge, Avatar, Typography, message, Breadcrumb, Tabs
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './App.css';

import Sidebar from './components/Sidebar';
import Login from './pages/login'; 
import Dashboard from './pages/dashboard';
import CustomerList from './pages/crm';
import ContractList from './pages/contract';
import ContractDetail from './pages/contract/detail';
import CertificationList from './pages/system/certification';
import CertificationDetail from './pages/system/certification/detail';
import InstitutionList from './pages/institutions/institutionList';
import NotificationList from './pages/system/notification';
import NotificationDetail from './pages/system/notification/detail';

const { Header, Content, Sider } = Layout;

// 权限校验组件：用于包裹独立页面，防止未登录访问，同时也避免被 AppLayout 的逻辑干扰
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLogin = localStorage.getItem('isLogin') === 'true';
  const token = localStorage.getItem('token');
  if (!isLogin || !token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': '业务看板',
  '/crm': '客户管理',
  '/contract': '合同管理',
  '/system/certification': '认证类型',
  '/system/notification': '通知管理',
};

const getBreadcrumbTitle = (path: string) => {
  if (breadcrumbNameMap[path]) return breadcrumbNameMap[path];
  if (path.startsWith('/system/certification/')) return '认证详情';
  if (path.startsWith('/contract/')) return '合同详情';
  return '当前页面';
};

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [panes, setPanes] = useState<{ label: string; key: string; closable?: boolean }[]>([
    { label: '业务看板', key: '/dashboard', closable: false }
  ]);
  const activeKey = location.pathname;

  useEffect(() => {
    const { pathname } = location;
    // 💡 排除掉独立页面，不让它们进入 Tabs 逻辑
    if (pathname === '/' || pathname === '/login' || pathname.startsWith('/system/notification/')) return;
    
    setPanes((prev) => {
      if (!prev.find(p => p.key === pathname)) {
        const title = breadcrumbNameMap[pathname] || getBreadcrumbTitle(pathname);
        return [...prev, { label: title, key: pathname }];
      }
      return prev;
    });
  }, [location]);

  const onTabEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const index = panes.findIndex(p => p.key === targetKey);
      const newPanes = panes.filter(p => p.key !== targetKey);
      setPanes(newPanes);
      if (targetKey === activeKey) {
        navigate(newPanes[index - 1]?.key || newPanes[0].key);
      }
    }
  };

  const isLogin = localStorage.getItem('isLogin') === 'true';
  const token = localStorage.getItem('token');
  if (!isLogin || !token) return <Navigate to="/login" replace />;

  const userInfo = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; }
  })();

  return (
    <Layout className="modern-glass-layout">
      <Sider width={240} trigger={null} collapsible collapsed={collapsed} className="modern-sider">
        <Sidebar collapsed={collapsed} activeKey={activeKey} />
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header className="modern-header">
          <Space>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
            <Breadcrumb items={[{ title: <HomeOutlined /> }, { title: getBreadcrumbTitle(activeKey) }]} />
          </Space>
          <Space size={16}>
            <Badge count={3} dot color="#71ccbc"><BellOutlined style={{ fontSize: 18, color: '#64748b' }} /></Badge>
            <div className="header-account-capsule">
              <Avatar size={24} style={{ backgroundColor: '#71ccbc' }} icon={<UserOutlined />} />
              <span className="user-text">{userInfo.nickname || '管理员'}</span>
              <div className="capsule-divider" />
              <LogoutOutlined className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }} />
            </div>
          </Space>
        </Header>
        <div className="modern-tabs-bar">
          <Tabs activeKey={activeKey} items={panes.map(p => ({ label: p.label, key: p.key, closable: p.closable }))} onChange={(key) => navigate(key)} onEdit={onTabEdit} type="editable-card" hideAdd className="custom-page-tabs" />
        </div>
        <Content className="modern-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#71ccbc', borderRadius: 12 } }}>
      <HashRouter>
        <div className="modern-app-canvas">
          <div className="bg-glow blob-1" />
          <div className="bg-glow blob-2" />
          
          <Routes>
            {/* 1. 绝对优先匹配：独立页面 */}
            <Route path="/login" element={<Login />} />
            
            {/* 💡 详情页放在最前面，并包裹 AuthGuard 确保权限 */}
            <Route path="/system/notification/detail/:id" element={
              <AuthGuard>
                <NotificationDetail />
              </AuthGuard>
            } />

            {/* 2. 嵌套业务路由 */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard data={{ monthlyRevenue: undefined, targetProgress: undefined, followUpList: undefined }} />} />
              <Route path="/crm" element={<CustomerList />} />
              <Route path="/contract" element={<ContractList />} />
              <Route path="/contract/:id" element={<ContractDetail />} />
              <Route path="/institution" element={<InstitutionList />} />
              <Route path="/system/certification" element={<CertificationList />} />
              <Route path="/system/certification/:id" element={<CertificationDetail />} />
              <Route path="/system/notification" element={<NotificationList />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* 3. 最后的兜底 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </ConfigProvider>
  );
};

export default App;