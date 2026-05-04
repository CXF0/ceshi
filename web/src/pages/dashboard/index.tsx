/**
 * @file web/src/pages/dashboard/index.tsx
 * @version 2.1.0 [2026-05-04]
 * @desc 缓存优化：
 *   - 看板数据缓存到 localStorage（key: dashboard_cache_{userId}）
 *   - 切换页面回来直接用缓存，不发请求
 *   - 点击「刷新」按钮才真正重新请求并更新缓存
 *   - 重新登录（缓存不存在）时自动请求
 *   - 缓存格式：{ data, period, timestamp }
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Spin, message, Space, Typography, Button, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import GlobalOverview from './components/GlobalOverview';
import AdminView from './components/AdminView';
import ConsultantView from './components/ConsultantView';
import ReviewerView from './components/ReviewerView';
import SalesView from './components/SalesView';
import request from '@/utils/request';

// ── 缓存工具 ─────────────────────────────────────────────
const CACHE_PREFIX = 'dashboard_cache_';

function getCacheKey(userId: string | number) {
  return `${CACHE_PREFIX}${userId}`;
}

function readCache(userId: string | number): { data: any; period: string; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(getCacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(userId: string | number, data: any, period: string) {
  try {
    localStorage.setItem(getCacheKey(userId), JSON.stringify({
      data,
      period,
      timestamp: Date.now(),
    }));
  } catch {}
}

function formatCacheTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ── 用户信息 ─────────────────────────────────────────────
const getUserFromStorage = (): any => {
  try {
    const s = localStorage.getItem('userInfo');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

const Dashboard: React.FC = () => {
  const [user] = useState<any>(() => getUserFromStorage());

  const [baseData, setBaseData]         = useState<any>(null);
  const [adminData, setAdminData]       = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminPeriod, setAdminPeriod]   = useState('month');

  const [consultantData, setConsultantData] = useState<any[]>([]);
  const [reviewerData, setReviewerData]     = useState<any[]>([]);

  const [salesData, setSalesData]       = useState<any>(null);
  const [salesUsers, setSalesUsers]     = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPeriod, setSalesPeriod]   = useState('month');
  const [salesUser, setSalesUser]       = useState<string | undefined>();

  const [baseLoading, setBaseLoading]     = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt]   = useState('');

  // 标记是否已从缓存初始化（避免重复请求）
  const initializedFromCache = useRef(false);

  const roleKey    = user?.roleKey || '';
  const isSuper    = roleKey === 'admin' || roleKey === 'head_manager' || roleKey === 'manager';
  const isConsultant = roleKey === 'consultant' || isSuper;
  const isReviewer   = roleKey === 'reviewer'   || isSuper;
  const isSales      = roleKey === 'sales'      || isSuper;

  // ── 应用数据到 state ────────────────────────────────────
  const applyData = useCallback((d: any) => {
    setBaseData(d);
    setAdminData(d?.adminStats || null);
    if (isConsultant) setConsultantData(d?.consultantTasks || []);
    if (isReviewer)   setReviewerData(d?.annualReviewAlerts || []);
    if (isSales) {
      setSalesUsers(d?.salesUsers || []);
      setSalesData(d?.salesStats || null);
    }
  }, [isConsultant, isReviewer, isSales]);

  // ── 真正的网络请求 ──────────────────────────────────────
  const fetchFromServer = useCallback(async (period: string, showLoading: boolean) => {
    if (!user) return;
    if (showLoading) setBaseLoading(true);
    else             setRefreshLoading(true);
    try {
      const res: any = await request.get('/dashboard/summary', {
        params: { role: roleKey, period },
      });
      const d = res?.data?.data || res?.data || res;
      applyData(d);
      // 写入缓存
      writeCache(user.id ?? user.userId, d, period);
      setLastUpdatedAt(formatCacheTime(Date.now()));
    } catch {
      message.error('看板数据加载失败');
    } finally {
      setBaseLoading(false);
      setRefreshLoading(false);
    }
  }, [user, roleKey, applyData]);

  // ── 初始化：优先读缓存，没有才请求 ─────────────────────
  useEffect(() => {
    if (!user || initializedFromCache.current) return;
    initializedFromCache.current = true;

    const userId = user.id ?? user.userId;
    const cached = readCache(userId);

    if (cached?.data) {
      // 有缓存：直接渲染，不发请求
      applyData(cached.data);
      if (cached.period) setAdminPeriod(cached.period);
      setLastUpdatedAt(formatCacheTime(cached.timestamp));
    } else {
      // 无缓存（首次登录）：发请求
      fetchFromServer(adminPeriod, true);
    }
  }, [user, applyData, fetchFromServer, adminPeriod]);

  // ── 手动刷新 ────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    fetchFromServer(adminPeriod, false);
  }, [fetchFromServer, adminPeriod]);

  // ── 切换统计周期时重新请求并更新缓存 ──────────────────
  const adminInited = useRef(false);
  useEffect(() => {
    if (!adminInited.current) { adminInited.current = true; return; }
    if (!user || !isSuper) return;

    setAdminLoading(true);
    request.get('/dashboard/summary', { params: { role: roleKey, period: adminPeriod } })
      .then((res: any) => {
        const d = res?.data?.data || res?.data || res;
        setAdminData(d?.adminStats || null);
        // 同步更新缓存中的 adminStats 和 period
        const userId = user.id ?? user.userId;
        const cached = readCache(userId);
        if (cached?.data) {
          writeCache(userId, { ...cached.data, adminStats: d?.adminStats }, adminPeriod);
        }
      })
      .catch(() => message.error('管理员统计加载失败'))
      .finally(() => setAdminLoading(false));
  }, [adminPeriod]); // eslint-disable-line

  // ── 切换销售筛选时重新请求 ────────────────────────────
  const salesInited = useRef(false);
  useEffect(() => {
    if (!salesInited.current) { salesInited.current = true; return; }
    if (!user || !isSales) return;

    setSalesLoading(true);
    request.get('/dashboard/summary', {
      params: { role: roleKey, period: salesPeriod, salesUserId: salesUser },
    })
      .then((res: any) => {
        const d = res?.data?.data || res?.data || res;
        setSalesData(d?.salesStats || null);
        if (d?.salesUsers) setSalesUsers(d.salesUsers);
      })
      .catch(() => message.error('销售数据加载失败'))
      .finally(() => setSalesLoading(false));
  }, [salesPeriod, salesUser]); // eslint-disable-line

  if (!user) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ minHeight: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          业务看板
        </Typography.Title>
        <Space>
          {lastUpdatedAt && (
            <Tooltip title="数据更新时间（切换页面不刷新，点击刷新按钮获取最新数据）">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {lastUpdatedAt}
              </Typography.Text>
            </Tooltip>
          )}
          <Button
            icon={<ReloadOutlined />}
            loading={refreshLoading}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </Space>
      </Space>

      <Spin spinning={baseLoading}>
        <GlobalOverview user={user} dashboardData={baseData} />

        <Row gutter={[16, 16]}>
          {isSuper && (
            <Col span={24}>
              <Spin spinning={adminLoading}>
                <AdminView
                  data={adminData || {}}
                  period={adminPeriod}
                  onPeriodChange={(v) => setAdminPeriod(v)}
                />
              </Spin>
            </Col>
          )}

          {(isConsultant || isReviewer) && (
            <>
              {isConsultant && (
                <Col xs={24} lg={isReviewer ? 12 : 24}>
                  <ConsultantView data={consultantData} />
                </Col>
              )}
              {isReviewer && (
                <Col xs={24} lg={isConsultant ? 12 : 24}>
                  <ReviewerView alerts={reviewerData} />
                </Col>
              )}
            </>
          )}

          {isSales && (
            <Col span={24}>
              <Spin spinning={salesLoading}>
                <SalesView
                  data={salesData}
                  salesUsers={salesUsers}
                  period={salesPeriod}
                  selectedUser={salesUser}
                  onPeriodChange={(v) => setSalesPeriod(v)}
                  onUserChange={(v) => setSalesUser(v)}
                />
              </Spin>
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;