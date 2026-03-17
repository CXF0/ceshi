/**
 * @file src/App.tsx
 * @version 2.1.1 [2026-03-13]
 * @desc 接入动态权限菜单过滤。
 */
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  UserOutlined, LogoutOutlined, BellOutlined, MenuFoldOutlined, 
  MenuUnfoldOutlined, HomeOutlined
} from '@ant-design/icons';
import {
  Layout, ConfigProvider, Button, Space, Badge, Avatar, Typography, message, Breadcrumb, Tabs
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './App.css';

import Sidebar from './components/Sidebar'; // 👈 引入新组件
import Login from './pages/login'; 
import Dashboard from './pages/dashboard';
import CustomerList from './pages/crm';
import ContractList from './pages/contract';
import ContractDetail from './pages/contract/detail';
import CertificationList from './pages/system/certification';
import CertificationDetail from './pages/system/certification/detail';
import InstitutionList from './pages/institutions/institutionList';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': '业务看板',
  '/crm': '客户管理',
  '/contract': '合同管理',
  '/contract/:id': '合同模板',
  '/system/certification': '认证类型',
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
    if (pathname === '/' || pathname === '/login') return;
    setPanes((prev) => {
      if (!prev.find(p => p.key === pathname) && breadcrumbNameMap[pathname]) {
        return [...prev, { label: breadcrumbNameMap[pathname], key: pathname }];
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

  const handleLogout = () => {
    localStorage.clear();
    message.success('已安全退出系统');
    navigate('/login');
  };

  const isLogin = localStorage.getItem('isLogin') === 'true';
  const token = localStorage.getItem('token');

  if (location.pathname === '/login') return <Login />;
  if (!isLogin || !token) return <Navigate to="/login" replace />;

  const userInfo = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; }
  })();

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#71ccbc', borderRadius: 12 } }}>
      <div className="modern-app-canvas">
        <div className="bg-glow blob-1" />
        <div className="bg-glow blob-2" />
        
        <Layout className="modern-glass-layout">
          <Sider width={240} trigger={null} collapsible collapsed={collapsed} className="modern-sider">
            {/* 使用抽离出的 Sidebar 组件 */}
            <Sidebar collapsed={collapsed} activeKey={activeKey} />
          </Sider>

          <Layout style={{ background: 'transparent' }}>
            <Header className="modern-header">
              <Space>
                <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
                <Breadcrumb items={[{ title: <HomeOutlined /> }, { title: breadcrumbNameMap[activeKey] || '当前页面' }]} />
              </Space>

              <Space size={16}>
                <Badge count={3} dot color="#71ccbc"><BellOutlined style={{ fontSize: 18, color: '#64748b' }} /></Badge>
                <div className="header-account-capsule">
                  <Avatar size={24} style={{ backgroundColor: '#71ccbc' }} icon={<UserOutlined />} />
                  <span className="user-text">{userInfo.nickname || '管理员'}</span>
                  <div className="capsule-divider" />
                  <LogoutOutlined className="logout-btn" onClick={handleLogout} />
                </div>
              </Space>
            </Header>

            <div className="modern-tabs-bar">
              <Tabs
                activeKey={activeKey}
                items={panes.map(p => ({ label: p.label, key: p.key, closable: p.closable }))}
                onChange={(key) => navigate(key)}
                onEdit={onTabEdit}
                type="editable-card"
                hideAdd
                className="custom-page-tabs"
              />
            </div>

            <Content className="modern-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard data={{
                  monthlyRevenue: undefined,
                  targetProgress: undefined,
                  followUpList: undefined
                }} />} />
                <Route path="/crm" element={<CustomerList />} />
                <Route path="/contract" element={<ContractList />} />
                <Route path="/contract/:id" element={<ContractDetail />} />
                <Route path="/institution" element={<InstitutionList />} />
                <Route path="/system/certification" element={<CertificationList />} />
                <Route path="/system/certification/:id" element={<CertificationDetail />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  );
};

const App: React.FC = () => <HashRouter><AppLayout /></HashRouter>;
export default App;