/**
 * @file web/src/pages/dashboard/index.tsx
 * @version 4.0.0 [2026-04-29]
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import GlobalOverview  from './components/GlobalOverview';
import AdminView       from './components/AdminView';
import ConsultantView  from './components/ConsultantView';
import ReviewerView    from './components/ReviewerView';
import SalesView       from './components/SalesView';
import { getDashboardSummary } from '@/services/dashboard';
import { message } from 'antd';

const Dashboard: React.FC = () => {
  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState<any>(null);
  const [user, setUser]         = useState<any>(null);
  const [period, setPeriod]     = useState<string>('month');
  const [salesUser, setSalesUser] = useState<string | undefined>();

  useEffect(() => {
    const saved = localStorage.getItem('userInfo');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const roleKey = user?.roleKey || 'admin';

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res: any = await getDashboardSummary({ role: roleKey, period, salesUserId: salesUser });
      const result = res?.data?.data || res?.data || res;
      setData(result);
    } catch {
      message.error('看板数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, period, salesUser]);

  if (loading || !user) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  const isSuper      = roleKey === 'admin' || roleKey === 'manager';
  const isConsultant = roleKey === 'consultant' || isSuper;
  const isReviewer   = roleKey === 'reviewer'   || isSuper;
  const isSales      = roleKey === 'sales'       || isSuper;

  return (
    <div style={{ minHeight: '100%' }}>
      <GlobalOverview user={user} dashboardData={data} />

      <Row gutter={[16, 16]}>
        {isSuper && (
          <Col span={24}>
            <AdminView
              data={data?.adminStats || {}}
              period={period}
              onPeriodChange={v => setPeriod(v)}
            />
          </Col>
        )}

        {isConsultant && (
          <Col span={isSuper && isReviewer ? 12 : 24}>
            <ConsultantView data={data?.consultantTasks || []} />
          </Col>
        )}

        {isReviewer && (
          <Col span={isSuper && isConsultant ? 12 : 24}>
            <ReviewerView alerts={data?.annualReviewAlerts || []} />
          </Col>
        )}

        {isSales && (
          <Col span={24}>
            <SalesView
              data={data?.salesStats || null}
              salesUsers={data?.salesUsers || []}
              period={period}
              selectedUser={salesUser}
              onPeriodChange={v => setPeriod(v)}
              onUserChange={v => setSalesUser(v)}
            />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Dashboard;