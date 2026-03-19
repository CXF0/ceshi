import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, message, Alert } from 'antd';
// 💡 导入刚才创建的组件
import ErrorBoundary from '@/utils/ErrorBoundary'; 
import GlobalOverview from './components/GlobalOverview';
import AdminView from './components/AdminView';
import ConsultantView from './components/ConsultantView';
import ReviewerView from './components/ReviewerView';
import SalesView from './components/SalesView';
import { getDashboardSummary } from '@/services/dashboard';

interface DashboardProps {
  data?: any; // 兼容兼容 App.tsx 里的传参
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('userInfo');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("解析用户信息失败", e);
      }
    }
  }, []);

  const roleKey = user?.roleKey || 'admin';

  useEffect(() => {
    if (!user) return;

    const initDashboard = async () => {
      setLoading(true);
      try {
        const res = await getDashboardSummary({ role: roleKey });
        const resultData = (res as any)?.data || res;
        
        if (resultData) {
          setData(resultData); 
        } else {
          message.error('获取数据失败');
        }
      } catch (error) {
        console.error('Dashboard Error:', error);
        // 💡 这里的报错不需要展示 Result 了，直接用 message
        message.error('看板网络请求异常，请检查网络');
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, [roleKey, user]);

  if (loading || !user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" tip="看板数据加载中..." />
      </div>
    );
  }

  // 权限逻辑
  const roleKeyVal = user?.roleKey || 'admin';
  const isSuper = roleKeyVal === 'admin' || roleKeyVal === 'manager';
  const isConsultant = roleKeyVal === 'consultant' || isSuper;
  const isReviewer = roleKeyVal === 'reviewer' || isSuper;
  const isSales = roleKeyVal === 'sales' || isSuper;

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 💡 第一块：全局概览栏（包含昵称、角色显示） */}
      {/* 如果这里崩溃了，只显示这一个开小差，下面图表继续显示 */}
      <ErrorBoundary title="欢迎栏加载失败" subTitle="无法加载昵称和公告信息">
        <GlobalOverview user={user} />
      </ErrorBoundary>
      
      {/* 💡 第二块：动态看板区域（最容易崩溃） */}
      {/* 如果这里崩溃了（比如 AdminView 里读了一个 undefined），
        用户只会看到图表区域变为了一个带“刷新页面”按钮的 Result，
        他仍然可以通过侧边栏切换到“合同管理”或“用户管理”页面继续工作。
      */}
      <ErrorBoundary 
        title="数据看板加载失败" 
        subTitle="非常抱歉，我们暂时无法从服务器获取完整的统计数据。"
      >
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
      </ErrorBoundary>
    </div>
  );
};

export default Dashboard;