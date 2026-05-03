/**
 * @file web/src/pages/dashboard/index.tsx
 * @version 4.2.0 [2026-04-29]
 * @desc 修复白屏：user 初始化改为同步读取，避免首渲染时 roleKey 为空
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, message } from 'antd';
import GlobalOverview from './components/GlobalOverview';
import AdminView      from './components/AdminView';
import ConsultantView from './components/ConsultantView';
import ReviewerView   from './components/ReviewerView';
import SalesView      from './components/SalesView';
import request        from '@/utils/request';

// ✅ 同步读取 userInfo，避免首次渲染时为 null 导致白屏
const getUserFromStorage = (): any => {
  try {
    const s = localStorage.getItem('userInfo');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

const Dashboard: React.FC = () => {
  // ✅ 直接用函数初始化，首次渲染就有值
  const [user] = useState<any>(() => getUserFromStorage());

  const [baseData,   setBaseData]   = useState<any>(null);
  const [adminData,  setAdminData]  = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminPeriod,  setAdminPeriod]  = useState('month');

  const [consultantData, setConsultantData] = useState<any[]>([]);
  const [reviewerData,   setReviewerData]   = useState<any[]>([]);

  const [salesData,    setSalesData]    = useState<any>(null);
  const [salesUsers,   setSalesUsers]   = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPeriod,  setSalesPeriod]  = useState('month');
  const [salesUser,    setSalesUser]    = useState<string | undefined>();

  const roleKey     = user?.roleKey || '';
  const isSuper     = roleKey === 'admin' || roleKey === 'manager';
  const isConsultant = roleKey === 'consultant' || isSuper;
  const isReviewer  = roleKey === 'reviewer'   || isSuper;
  const isSales     = roleKey === 'sales'      || isSuper;

  // ── 初始加载：基础数据 ────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchBase = async () => {
      try {
        const res: any = await request.get('/dashboard/summary', {
          params: { role: roleKey, period: adminPeriod },
        });
        const d = res?.data?.data || res?.data || res;
        setBaseData(d);
        setAdminData(d?.adminStats || null);
        if (isConsultant) setConsultantData(d?.consultantTasks  || []);
        if (isReviewer)   setReviewerData(d?.annualReviewAlerts || []);
        if (isSales) {
          setSalesUsers(d?.salesUsers || []);
          setSalesData(d?.salesStats  || null);
        }
      } catch { message.error('看板数据加载失败'); }
    };
    fetchBase();
  }, []); // 只在挂载时跑一次

  // ── AdminView 独立：只在 adminPeriod 切换时重新请求 ──
  const [adminInited, setAdminInited] = useState(false);
  useEffect(() => {
    // 跳过初次（由上面的 fetchBase 处理）
    if (!adminInited) { setAdminInited(true); return; }
    if (!user || !isSuper) return;
    setAdminLoading(true);
    request.get('/dashboard/summary', { params: { role: roleKey, period: adminPeriod } })
      .then((res: any) => {
        const d = res?.data?.data || res?.data || res;
        setAdminData(d?.adminStats || null);
      })
      .catch(() => message.error('管理员统计加载失败'))
      .finally(() => setAdminLoading(false));
  }, [adminPeriod]);

  // ── SalesView 独立：只在 salesPeriod/salesUser 切换时重新请求 ──
  const [salesInited, setSalesInited] = useState(false);
  useEffect(() => {
    if (!salesInited) { setSalesInited(true); return; }
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
  }, [salesPeriod, salesUser]);

  // 未登录时不渲染（理论上路由已守卫，这里保底）
  if (!user) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ minHeight: '100%' }}>
      <GlobalOverview user={user} dashboardData={baseData} />

      <Row gutter={[16, 16]}>
        {isSuper && (
          <Col span={24}>
            <Spin spinning={adminLoading}>
              <AdminView
                data={adminData || {}}
                period={adminPeriod}
                onPeriodChange={v => setAdminPeriod(v)}
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
                onPeriodChange={v => setSalesPeriod(v)}
                onUserChange={v => setSalesUser(v)}
              />
            </Spin>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Dashboard;