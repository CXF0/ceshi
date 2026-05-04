/**
 * @file src/App.tsx
 * @version 3.1.0 [2026-05-04]
 * @desc 铃铛改为 SSE 长连接实时推送，新咨询触发弹窗 + 提示音
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HashRouter, Routes, Route, useNavigate, useLocation, Navigate, Outlet,
} from 'react-router-dom';
import {
  UserOutlined, LogoutOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, HomeOutlined,
  CheckCircleOutlined, PhoneOutlined, ClockCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  Layout, ConfigProvider, Button, Space, Badge, Avatar, Breadcrumb, Tabs,
  Drawer, List, Tag, Tooltip, Spin, message, Modal,
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import './App.css';
import request from '@/utils/request';

import Sidebar           from './components/Sidebar';
import Homepage          from './pages/homepage';
import ServicesPage      from './pages/homepage/ServicesPage';
import CasesPage         from './pages/homepage/CasesPage';
import AboutPage         from './pages/homepage/AboutPage';
import Dashboard         from './pages/dashboard';
import CustomerList      from './pages/crm';
import ContractList      from './pages/contract';
import ContractDetail    from './pages/contract/detail';
import CertificateList   from './pages/certificates';
import CertificationList from './pages/system/certification';
import CertificationDetail from './pages/system/certification/detail';
import InstitutionList   from './pages/institutions/institutionList';
import NotificationList  from './pages/system/notification/NotificationList';
import NotificationDetail from './pages/system/notification/detail';
import NotificationCreate from './pages/system/notification/NotificationCreate';
import UserList          from './pages/system/users/UserList';
import RoleList          from './pages/system/roles/RoleList';
import DeptList          from './pages/system/dept/DeptList';
import WebsiteManagement from './pages/website';
import InquiriesPage     from './pages/inquiries';
import nprogress         from './utils/nprogress';

const { Header, Content, Sider } = Layout;

// ─── 面包屑 ───────────────────────────────────────────────
export const breadcrumbNameMap: Record<string, string> = {
  '/dashboard':                   '业务看板',
  '/crm':                         '客户管理',
  '/contract':                    '合同管理',
  '/certificates':                '证书管理',
  '/institutions':                '机构管理',
  '/inquiries':                   '客户咨询',
  '/system/certification':        '认证类型',
  '/system/notification':         '通知管理',
  '/system/notification/create':  '发布公告',
  '/system/users':                '用户管理',
  '/system/roles':                '角色管理',
  '/system/depts':                '公司管理',
  '/system/website':              '官网管理',
};

export const getBreadcrumbTitle = (path: string) => {
  if (breadcrumbNameMap[path]) return breadcrumbNameMap[path];
  if (path.startsWith('/system/certification/')) return '认证详情';
  if (path.startsWith('/contract/')) return '合同详情';
  if (path.startsWith('/system/notification/detail/')) return '公告详情';
  return '当前页面';
};

const STATUS_MAP = [
  { value: 0, label: '待跟进', color: 'orange' },
  { value: 1, label: '跟进中', color: 'blue'   },
  { value: 2, label: '已完成', color: 'green'  },
];

// ─── 新咨询提醒弹窗 ───────────────────────────────────────
const NewInquiryAlert: React.FC<{
  inquiry: any;
  onClose: () => void;
  onGoTo: () => void;
}> = ({ inquiry, onClose, onGoTo }) => (
  <div style={{
    position: 'fixed', top: 24, right: 24, zIndex: 9999,
    width: 340, background: 'white', borderRadius: 16,
    boxShadow: '0 16px 48px -8px rgba(37,99,235,0.25)',
    border: '1px solid rgba(37,99,235,0.15)',
    animation: 'alert-slide-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    overflow: 'hidden',
  }}>
    <style>{`
      @keyframes alert-slide-in {
        from { opacity:0; transform:translateX(60px) scale(0.9); }
        to   { opacity:1; transform:none; }
      }
    `}</style>
    {/* 顶部蓝色条 */}
    <div style={{ height: 4, background: 'linear-gradient(90deg,#2563eb,#7c3aed)' }} />
    <div style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* 图标 */}
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 20,
        }}>
          💬
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>新咨询来了！</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{inquiry.name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ fontSize: 11 }} /> {inquiry.phone}
          </div>
          {inquiry.content && (
            <div style={{
              fontSize: 12, color: '#9ca3af', marginTop: 6,
              background: '#f9fafb', borderRadius: 8, padding: '6px 10px',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {inquiry.content}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#c0c8d8', marginTop: 6 }}>
            {dayjs(inquiry.createdAt).format('HH:mm:ss')}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onGoTo} style={{
          flex: 1, padding: '8px 0', background: '#2563eb', color: 'white',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
          立即查看
        </button>
        <button onClick={onClose} style={{
          padding: '8px 16px', background: '#f3f4f6', color: '#6b7280',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
        }}>
          稍后
        </button>
      </div>
    </div>
  </div>
);

// ─── 消息抽屉 ─────────────────────────────────────────────
const InquiryDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  onCountChange: (n: number) => void;
}> = ({ open, onClose, onCountChange }) => {
  const navigate = useNavigate();
  const [list, setList]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const userInfo = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; } })();

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res: any = await request.get('/inquiries/recent', { params: { limit: 20 } });
      const data: any[] = res?.data?.data ?? res?.data ?? [];
      setList(data);
      const unreadIds = data.filter((d: any) => !d.isRead).map((d: any) => d.id);
      if (unreadIds.length > 0) {
        await request.patch('/inquiries/read', { ids: unreadIds });
        onCountChange(0);
      }
    } catch { message.error('加载咨询消息失败'); }
    finally { setLoading(false); }
  }, [open]);

  useEffect(() => { load(); }, [load]);

  const handleFollow = async (item: any) => {
    try {
      const res: any = await request.patch(`/inquiries/${item.id}/follow`, {
        operatorId: userInfo.id || 0,
        operatorName: userInfo.nickname || '未知',
      });
      const updated = res?.data?.data ?? res?.data;
      setList(prev => prev.map(r => r.id === item.id ? updated : r));
      message.success('已标记跟进');
    } catch { message.error('操作失败'); }
  };

  return (
    <Drawer
      title={
        <Space>
          <BellOutlined style={{ color: '#2563eb' }} />
          <span>客户咨询消息</span>
          <Button type="link" size="small" onClick={() => { onClose(); navigate('/inquiries'); }} style={{ padding: 0, fontSize: 12 }}>
            查看全部 →
          </Button>
        </Space>
      }
      open={open} onClose={onClose} width={420} placement="right"
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>暂无咨询消息</div>
      ) : (
        <List
          dataSource={list}
          renderItem={item => {
            const s = STATUS_MAP.find(x => x.value === item.status);
            return (
              <List.Item
                style={{ padding: '14px 20px', background: !item.isRead ? '#fafbff' : 'white', borderLeft: !item.isRead ? '3px solid #2563eb' : '3px solid transparent' }}
                actions={[
                  item.status === 0 ? (
                    <Button key="f" size="small" type="primary" onClick={e => { e.stopPropagation(); handleFollow(item); }}>标记跟进</Button>
                  ) : item.status === 1 ? (
                    <Tooltip key="i" title={`${item.followName} ${dayjs(item.followAt).format('MM-DD HH:mm')} 跟进`}>
                      <Tag color="blue">跟进中</Tag>
                    </Tooltip>
                  ) : (
                    <Tag key="d" color="green">已完成</Tag>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>}
                  title={
                    <Space size={6}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
                      <Tag color={s?.color} style={{ margin: 0, fontSize: 11 }}>{s?.label}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PhoneOutlined />{item.phone}
                      </div>
                      {item.content && (
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 200 }}>
                          {item.content}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#c0c8d8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockCircleOutlined />{dayjs(item.createdAt).format('MM-DD HH:mm')}
                      </div>
                      {item.followName && (
                        <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2 }}>
                          跟进：{item.followName} · {dayjs(item.followAt).format('MM-DD HH:mm')}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Drawer>
  );
};

// ─── 后台布局 ─────────────────────────────────────────────
const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const [panes, setPanes] = useState<{ label: string; key: string; closable?: boolean }[]>([
    { label: '业务看板', key: '/dashboard', closable: false },
  ]);
  const [activeKey, setActiveKey] = useState('/dashboard');

  // ── 铃铛 + SSE + 新咨询弹窗 ─────────────────────────────
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [bellOpen,     setBellOpen]     = useState(false);
  const [alertInquiry, setAlertInquiry] = useState<any>(null);
  // 自动关闭定时器
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userInfo = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; }
  })();

  /** Web Audio API 合成提示音（do-mi-sol 三音） */
  const playAlert = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beep = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        g.gain.setValueAtTime(0.28, ctx.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime  + start + dur + 0.05);
      };
      beep(523, 0,    0.15); // do
      beep(659, 0.18, 0.15); // mi
      beep(784, 0.36, 0.28); // sol
    } catch { /* 浏览器限制时静默 */ }
  }, []);

  /** 关闭弹窗 */
  const closeAlert = useCallback(() => {
    setAlertInquiry(null);
    if (alertTimer.current) clearTimeout(alertTimer.current);
  }, []);

  /** 初始拉取未读数 */
  const fetchUnread = useCallback(async () => {
    try {
      const res: any = await request.get('/inquiries/unread-count');
      setUnreadCount(res?.data?.data?.count ?? res?.data?.count ?? 0);
    } catch {}
  }, []);

  /** SSE 长连接 — 仅在已登录的后台页面建立 */
  useEffect(() => {
    fetchUnread();

    const uid   = String(userInfo.id || userInfo.nickname || Date.now());
    const token = localStorage.getItem('token') || '';
    const url   = `/api/inquiries/sse?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`;
    const es    = new EventSource(url);

    es.addEventListener('new-inquiry', (e: MessageEvent) => {
      const inquiry = JSON.parse(e.data);
      setUnreadCount(prev => prev + 1);
      setAlertInquiry(inquiry);
      playAlert();
      // 8秒后自动关闭弹窗
      if (alertTimer.current) clearTimeout(alertTimer.current);
      alertTimer.current = setTimeout(() => setAlertInquiry(null), 8000);
    });

    // 30s 轮询兜底（SSE 断线期间不漏数）
    const timer = setInterval(fetchUnread, 30_000);

    return () => {
      es.close();
      clearInterval(timer);
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location.pathname === '/') return;
    nprogress.start(); nprogress.done();
    window.scrollTo(0, 0);
    return () => { nprogress.done(); };
  }, [location.pathname]);

  // ── Tab 管理 ────────────────────────────────────────────
  useEffect(() => {
    const key = location.pathname;
    if (key === '/') return;
    setActiveKey(key);
    setPanes(prev => {
      if (prev.some(p => p.key === key)) return prev;
      return [...prev, { label: getBreadcrumbTitle(key), key, closable: true }];
    });
  }, [location.pathname]);

  const onTabEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action !== 'remove') return;
    setPanes(prev => {
      const idx  = prev.findIndex(p => p.key === targetKey);
      const next = prev.filter(p => p.key !== targetKey);
      if (targetKey === activeKey && next.length > 0) {
        navigate(next[Math.min(idx, next.length - 1)].key);
      }
      return next;
    });
  };

  return (
    <Layout className="modern-glass-layout">
      <Sider width={220} collapsedWidth={64} collapsible collapsed={collapsed} trigger={null}
        style={{ background: 'transparent', borderRight: '1px solid rgba(37,99,235,0.06)' }}>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? 0 : '0 20px', borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
          {!collapsed
            ? <span style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', color: '#2563eb' }}>ZhengDaTong</span>
            : <span style={{ fontSize: 18, fontWeight: 900, color: '#2563eb' }}>Z</span>
          }
        </div>
        <Sidebar collapsed={collapsed} activeKey={activeKey} />
      </Sider>

      <Layout style={{ background: 'transparent' }}>
        <Header className="modern-header">
          <Space size={12}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)} style={{ color: '#4b5563' }} />
            <Breadcrumb
              items={[{ title: <HomeOutlined style={{ color: '#93aac9' }} /> }, { title: getBreadcrumbTitle(activeKey) }]}
              style={{ fontSize: 13 }}
            />
          </Space>
          <Space size={14}>
            {/* ★ 铃铛 — SSE 实时未读数 */}
            <Badge count={unreadCount} overflowCount={99} color="#2563eb">
              <BellOutlined
                style={{ fontSize: 17, color: '#6b7280', cursor: 'pointer' }}
                onClick={() => setBellOpen(true)}
              />
            </Badge>
            <div className="header-account-capsule">
              <Avatar size={24} style={{ backgroundColor: '#2563eb' }} icon={<UserOutlined />} />
              <span className="user-text">{userInfo.nickname || '管理员'}</span>
              <div className="capsule-divider" />
              <LogoutOutlined className="logout-btn" title="退出登录"
                onClick={() => { localStorage.clear(); navigate('/'); }} />
            </div>
          </Space>
        </Header>

        <div className="modern-tabs-bar">
          <Tabs activeKey={activeKey}
            items={panes.map(p => ({ label: p.label, key: p.key, closable: p.closable }))}
            onChange={key => navigate(key)} onEdit={onTabEdit}
            type="editable-card" hideAdd className="custom-page-tabs" />
        </div>

        <Content className="modern-content fade-in">
          <Outlet />
        </Content>
      </Layout>

      {/* ★ 消息抽屉 */}
      <InquiryDrawer
        open={bellOpen}
        onClose={() => { setBellOpen(false); fetchUnread(); }}
        onCountChange={setUnreadCount}
      />

      {/* ★ 新咨询实时弹窗（右上角） */}
      {alertInquiry && (
        <NewInquiryAlert
          inquiry={alertInquiry}
          onClose={closeAlert}
          onGoTo={() => { closeAlert(); setBellOpen(true); navigate('/inquiries'); }}
        />
      )}
    </Layout>
  );
};

// ─── 根组件 ───────────────────────────────────────────────
const App: React.FC = () => (
  <ConfigProvider locale={zhCN} theme={{
    token: {
      colorPrimary: '#2563eb', colorLink: '#2563eb',
      borderRadius: 10, borderRadiusLG: 14,
      fontFamily: "'Inter', 'Noto Sans SC', -apple-system, sans-serif",
      boxShadow: '0 4px 16px -4px rgba(37,99,235,0.12)',
    },
    components: {
      Menu:   { itemBorderRadius: 10, itemSelectedBg: 'rgba(37,99,235,0.08)', itemSelectedColor: '#2563eb', itemHoverBg: 'rgba(37,99,235,0.05)', itemHoverColor: '#2563eb' },
      Button: { primaryShadow: '0 4px 12px rgba(37,99,235,0.25)' },
      Table:  { headerBg: 'rgba(248,250,255,0.9)', borderColor: 'rgba(37,99,235,0.06)' },
      Card:   { borderRadiusLG: 16 },
    },
  }}>
    <HashRouter>
      <Routes>
        {/* 官网页面 */}
        <Route path="/"         element={<Homepage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/cases"    element={<CasesPage />} />
        <Route path="/about"    element={<AboutPage />} />

        {/* 后台管理 */}
        <Route element={
          <div className="modern-app-canvas">
            <div className="bg-glow blob-1" /><div className="bg-glow blob-2" />
            <AppLayout />
          </div>
        }>
          <Route path="/dashboard"                        element={<Dashboard />} />
          <Route path="/crm"                              element={<CustomerList />} />
          <Route path="/contract"                         element={<ContractList />} />
          <Route path="/contract/:id"                     element={<ContractDetail />} />
          <Route path="/certificates"                     element={<CertificateList />} />
          <Route path="/institutions"                     element={<InstitutionList />} />
          <Route path="/inquiries"                        element={<InquiriesPage />} />
          <Route path="/system/certification"             element={<CertificationList />} />
          <Route path="/system/certification/:id"         element={<CertificationDetail />} />
          <Route path="/system/notification"              element={<NotificationList />} />
          <Route path="/system/notification/create"       element={<NotificationCreate />} />
          <Route path="/system/notification/detail/:id"   element={<NotificationDetail />} />
          <Route path="/system/users"                     element={<UserList />} />
          <Route path="/system/roles"                     element={<RoleList />} />
          <Route path="/system/depts"                     element={<DeptList />} />
          <Route path="/system/website"                   element={<WebsiteManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </ConfigProvider>
);

export default App;