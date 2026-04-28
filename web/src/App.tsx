/**
 * @file src/App.tsx
 * @version 2.2.3 [2026-03-18]
 * @desc 优化路由权重，支持通知公告全流程（列表、发布、详情）的 Tabs 集成。
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

// 导入页面组件
import Sidebar from './components/Sidebar';
import Login from './pages/login'; 
import Dashboard from './pages/dashboard';
import CustomerList from './pages/crm';
import ContractList from './pages/contract';
import ContractDetail from './pages/contract/detail';
import CertificateList from './pages/certificates';
import CertificationList from './pages/system/certification';
import CertificationDetail from './pages/system/certification/detail';
import InstitutionList from './pages/institutions/institutionList';
import NotificationList from './pages/system/notification/NotificationList';
import NotificationDetail from './pages/system/notification/detail'; // 阅读页
import NotificationCreate from './pages/system/notification/NotificationCreate'; // 发布/编辑页
import UserList from './pages/system/users/UserList';
import nprogress from './utils/nprogress';

const { Header, Content, Sider } = Layout;

// 1. 面包屑与标签页名称映射
const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': '业务看板',
  '/crm': '客户管理',
  '/contract': '合同管理',
  '/certificates': '证书管理',
  '/institutions': '机构管理',
  '/system/certification': '认证类型',
  '/system/notification': '通知管理',
  '/system/notification/create': '发布公告',
  '/system/users': '用户管理',
};

// 2. 动态获取标题函数
const getBreadcrumbTitle = (path: string) => {
  if (breadcrumbNameMap[path]) return breadcrumbNameMap[path];
  if (path.startsWith('/system/certification/')) return '认证详情';
  if (path.startsWith('/contract/')) return '合同详情';
  if (path.startsWith('/system/notification/detail/')) return '公告详情';
  return '当前页面';
};

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    // 💡 优化：如果是从 / 重定向到 /dashboard，避免无谓的闪烁
  if (location.pathname === '/') return;
    // 1. 路由开始变化：启动进度条
    nprogress.start();

    // 2. 路由渲染完成：结束进度条
    nprogress.done();

    // 3. 页面切换自动回顶（增强体验）
    window.scrollTo(0, 0);

    // 清理函数
    return () => {
      nprogress.done();
    };
  }, [location.pathname]); // 核心：监听路径变化
  // 标签页状态
  const [panes, setPanes] = useState<{ label: string; key: string; closable?: boolean }[]>([
    { label: '业务看板', key: '/dashboard', closable: false }
  ]);
  const activeKey = location.pathname;

  // 3. 标签页自动同步逻辑
  useEffect(() => {
    const { pathname } = location;
    
    // 排除无需显示在 Tabs 中的页面
    if (pathname === '/' || pathname === '/login' || pathname === '') return;

    setPanes((prev) => {
      // 如果标签页不存在，则添加
      if (!prev.find(p => p.key === pathname)) {
        const title = getBreadcrumbTitle(pathname);
        return [...prev, { label: title, key: pathname }];
      }
      return prev;
    });
  }, [location]);

  // 4. 关闭标签页逻辑
  const onTabEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const index = panes.findIndex(p => p.key === targetKey);
      const newPanes = panes.filter(p => p.key !== targetKey);
      setPanes(newPanes);
      if (targetKey === activeKey) {
        // 关闭当前页后跳转至前一页或首页
        navigate(newPanes[index - 1]?.key || newPanes[0].key);
      }
    }
  };

  // 5. 基础登录校验
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
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)} 
            />
            <Breadcrumb items={[{ title: <HomeOutlined /> }, { title: getBreadcrumbTitle(activeKey) }]} />
          </Space>
          <Space size={16}>
            <Badge count={3} dot color="#71ccbc">
              <BellOutlined style={{ fontSize: 18, color: '#64748b' }} />
            </Badge>
            <div className="header-account-capsule">
              <Avatar size={24} style={{ backgroundColor: '#71ccbc' }} icon={<UserOutlined />} />
              <span className="user-text">{userInfo.nickname || '管理员'}</span>
              <div className="capsule-divider" />
              <LogoutOutlined className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }} />
            </div>
          </Space>
        </Header>

        {/* 顶部标签导航栏 */}
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

        {/* 主内容区域 */}
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
            {/* 登录页独立路由 */}
            <Route path="/login" element={<Login />} />
            
            {/* 嵌套在管理布局下的业务路由 */}
            <Route element={<AppLayout />}>
              {/* 首页 */}
              <Route path="/dashboard" element={<Dashboard data={{ monthlyRevenue: undefined, targetProgress: undefined, followUpList: undefined }} />} />
              
              {/* 业务模块 */}
              <Route path="/crm" element={<CustomerList />} />
              <Route path="/contract" element={<ContractList />} />
              <Route path="/contract/:id" element={<ContractDetail />} />
              <Route path="/certificates" element={<CertificateList />} />
              <Route path="/institutions" element={<InstitutionList />} />
              
              {/* 系统设置 - 认证管理 */}
              <Route path="/system/certification" element={<CertificationList />} />
              <Route path="/system/certification/:id" element={<CertificationDetail />} />
              
              {/* 系统设置 - 通知公告管理流程 */}
              <Route path="/system/notification" element={<NotificationList />} />
              <Route path="/system/notification/create" element={<NotificationCreate />} />
              <Route path="/system/notification/detail/:id" element={<NotificationDetail />} />
              <Route path="/system/users" element={<UserList />} />
              
              {/* 根路径重定向 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* 全局兜底重定向 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </ConfigProvider>
  );
};

export default App;