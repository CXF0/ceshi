import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, message } from 'antd';
import GlobalOverview from './components/GlobalOverview';
import AdminView from './components/AdminView';
import ConsultantView from './components/ConsultantView';
import ReviewerView from './components/ReviewerView';
import SalesView from './components/SalesView';
import { getDashboardSummary } from '@/services/dashboard';

interface DashboardProps {
  data?: {
    monthlyRevenue: number | undefined;
    targetProgress: number | undefined;
    followUpList: any[] | undefined;
  };
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const roleKey = userInfo.roleKey || 'admin';

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      try {
        const res = await getDashboardSummary({ role: roleKey });
        if ((res as any)?.code === 200 || (res as any)?.data?.code === 200) {
          setData(res.data || res); 
        } else {
          message.error((res as any)?.data?.message || (res as any)?.message || '获取数据失败');
        }
      } catch (error) {
        console.error('Dashboard Error:', error);
        message.error('网络请求异常');
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, [roleKey]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" tip="看板数据加载中..." />
      </div>
    );
  }

  const isSuper = roleKey === 'admin' || roleKey === 'manager';
  const isConsultant = roleKey === 'consultant' || isSuper;
  const isReviewer = roleKey === 'reviewer' || isSuper;
  const isSales = roleKey === 'sales' || isSuper;

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <GlobalOverview user={userInfo} />
      <Row gutter={[16, 16]}>
        {isSuper && (
          <Col span={24}>
            <AdminView data={data?.adminStats || {}} />
          </Col>
        )}
        {isConsultant && (
          <Col span={isSuper ? 12 : 24}>
            <ConsultantView data={data?.consultantTasks || []} />
          </Col>
        )}
        {isReviewer && (
          <Col span={isSuper ? 12 : 24}>
            <ReviewerView alerts={data?.annualReviewAlerts || []} />
          </Col>
        )}
        {isSales && (
          <Col span={24}>
            <SalesView data={data?.salesStats || {}} />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Dashboard;