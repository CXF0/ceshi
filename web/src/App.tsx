/**
 * @file src/App.tsx
 * @version 2.4.0 [2026-04-28]
 * @desc 路由更新：根路径 / 指向官网首页，登录改为弹窗形式，移除独立 /login 路由。
 */
import React, { useState, useEffect } from 'react';
import {
  HashRouter, Routes, Route, useNavigate, useLocation, Navigate, Outlet
} from 'react-router-dom';
import {
  UserOutlined, LogoutOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, HomeOutlined
} from '@ant-design/icons';
import {
  Layout, ConfigProvider, Button, Space, Badge, Avatar, Breadcrumb, Tabs
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './App.css';

// 页面组件
import Sidebar from './components/Sidebar';
import Homepage from './pages/homepage';           // ← 官网首页
import Dashboard from './pages/dashboard';
import CustomerList from './pages/crm';
import ContractList from './pages/contract';
import ContractDetail from './pages/contract/detail';
import CertificateList from './pages/certificates';
import CertificationList from './pages/system/certification';
import CertificationDetail from './pages/system/certification/detail';
import InstitutionList from './pages/institutions/institutionList';
import NotificationList from './pages/system/notification/NotificationList';
import NotificationDetail from './pages/system/notification/detail';
import NotificationCreate from './pages/system/notification/NotificationCreate';
import UserList from './pages/system/users/UserList';
import RoleList from './pages/system/roles/RoleList';
import nprogress from './utils/nprogress';

const { Header, Content, Sider } = Layout;

// ─── 面包屑名称映射 ───
export const breadcrumbNameMap: Record<string, string> = {
  '/dashboard':                    '业务看板',
  '/crm':                          '客户管理',
  '/contract':                     '合同管理',
  '/certificates':                 '证书管理',
  '/institutions':                 '机构管理',
  '/system/certification':         '认证类型',
  '/system/notification':          '通知管理',
  '/system/notification/create':   '发布公告',
  '/system/users':                 '用户管理',
  '/system/roles':                 '角色管理',   // ← 新增
};

export const getBreadcrumbTitle = (path: string) => {
  if (breadcrumbNameMap[path]) return breadcrumbNameMap[path];
  if (path.startsWith('/system/certification/')) return '认证详情';
  if (path.startsWith('/contract/')) return '合同详情';
  if (path.startsWith('/system/notification/detail/')) return '公告详情';
  return '当前页面';
};

// ─── 后台管理布局（需登录） ───
const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') return;
    nprogress.start();
    nprogress.done();
    window.scrollTo(0, 0);
    return () => { nprogress.done(); };
  }, [location.pathname]);

  const [panes, setPanes] = useState<{ label: string; key: string; closable?: boolean }[]>([
    { label: '业务看板', key: '/dashboard', closable: false }
  ]);
  const activeKey = location.pathname;

  useEffect(() => {
    const { pathname } = location;
    if (['/login', '/'].includes(pathname)) return;
    setPanes(prev => {
      if (!prev.find(p => p.key === pathname)) {
        return [...prev, { label: getBreadcrumbTitle(pathname), key: pathname }];
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

  // 未登录则返回官网首页
  const isLogin = localStorage.getItem('isLogin') === 'true';
  const token = localStorage.getItem('token');
  if (!isLogin || !token) return <Navigate to="/" replace />;

  const userInfo = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; }
  })();

  return (
    <Layout className="modern-glass-layout">
      <Sider width={220} trigger={null} collapsible collapsed={collapsed} className="modern-sider">
        <div className="modern-logo-section">
          <div className="modern-logo-mark" />
          {!collapsed && (
            <div className="modern-logo-text">
              正达认证
              <br />
              <span style={{ fontSize: 10, fontWeight: 400, color: '#93aac9', fontStyle: 'normal', letterSpacing: '0.05em' }}>
                CRM V1.0
              </span>
            </div>
          )}
        </div>
        <div className="sider-menu-container">
          <Sidebar collapsed={collapsed} activeKey={activeKey} />
        </div>
      </Sider>

      <Layout style={{ background: 'transparent' }}>
        <Header className="modern-header">
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#4b5563' }}
            />
            <Breadcrumb
              items={[{ title: <HomeOutlined style={{ color: '#93aac9' }} /> }, { title: getBreadcrumbTitle(activeKey) }]}
              style={{ fontSize: 13 }}
            />
          </Space>
          <Space size={14}>
            <Badge count={3} dot color="#2563eb">
              <BellOutlined style={{ fontSize: 17, color: '#6b7280', cursor: 'pointer' }} />
            </Badge>
            <div className="header-account-capsule">
              <Avatar size={24} style={{ backgroundColor: '#2563eb' }} icon={<UserOutlined />} />
              <span className="user-text">{userInfo.nickname || '管理员'}</span>
              <div className="capsule-divider" />
              <LogoutOutlined
                className="logout-btn"
                title="退出登录"
                onClick={() => { localStorage.clear(); navigate('/'); }}
              />
            </div>
          </Space>
        </Header>

        <div className="modern-tabs-bar">
          <Tabs
            activeKey={activeKey}
            items={panes.map(p => ({ label: p.label, key: p.key, closable: p.closable }))}
            onChange={key => navigate(key)}
            onEdit={onTabEdit}
            type="editable-card"
            hideAdd
            className="custom-page-tabs"
          />
        </div>

        <Content className="modern-content fade-in">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

// ─── 根组件 ───
const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorLink: '#2563eb',
          borderRadius: 10,
          borderRadiusLG: 14,
          fontFamily: "'Inter', 'Noto Sans SC', -apple-system, sans-serif",
          boxShadow: '0 4px 16px -4px rgba(37,99,235,0.12)',
        },
        components: {
          Menu: {
            itemBorderRadius: 10,
            itemSelectedBg: 'rgba(37,99,235,0.08)',
            itemSelectedColor: '#2563eb',
            itemHoverBg: 'rgba(37,99,235,0.05)',
            itemHoverColor: '#2563eb',
          },
          Button: { primaryShadow: '0 4px 12px rgba(37,99,235,0.25)' },
          Table: { headerBg: 'rgba(248,250,255,0.9)', borderColor: 'rgba(37,99,235,0.06)' },
          Card: { borderRadiusLG: 16 },
        },
      }}
    >
      <HashRouter>
        <Routes>
          {/* ① 官网首页 — 根路径，全屏独立，不套后台容器 */}
          <Route path="/" element={<Homepage />} />

          {/* ② 后台管理 — 套毛玻璃布局容器 */}
          <Route
            element={
              <div className="modern-app-canvas">
                <div className="bg-glow blob-1" />
                <div className="bg-glow blob-2" />
                <AppLayout />
              </div>
            }
          >
            <Route path="/dashboard" element={<Dashboard data={{ monthlyRevenue: undefined, targetProgress: undefined, followUpList: undefined }} />} />
            <Route path="/crm" element={<CustomerList />} />
            <Route path="/contract" element={<ContractList />} />
            <Route path="/contract/:id" element={<ContractDetail />} />
            <Route path="/certificates" element={<CertificateList />} />
            <Route path="/institutions" element={<InstitutionList />} />
            <Route path="/system/certification" element={<CertificationList />} />
            <Route path="/system/certification/:id" element={<CertificationDetail />} />
            <Route path="/system/notification" element={<NotificationList />} />
            <Route path="/system/notification/create" element={<NotificationCreate />} />
            <Route path="/system/notification/detail/:id" element={<NotificationDetail />} />
            <Route path="/system/users" element={<UserList />} />
            <Route path="/system/roles" element={<RoleList />} />
          </Route>

          {/* ③ 兜底 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ConfigProvider>
  );
};

export default App;