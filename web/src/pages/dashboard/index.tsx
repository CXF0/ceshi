/**
 * @file src/pages/dashboard/index.tsx
 * @version 3.0.0 [2026-04-28]
 * @desc 业务看板入口 - 修复背景兼容毛玻璃主题，GlobalOverview 接收真实统计数据
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import ErrorBoundary from '@/utils/ErrorBoundary';
import GlobalOverview from './components/GlobalOverview';
import AdminView from './components/AdminView';
import ConsultantView from './components/ConsultantView';
import ReviewerView from './components/ReviewerView';
import SalesView from './components/SalesView';
import { getDashboardSummary } from '@/services/dashboard';
import { message } from 'antd';

interface DashboardProps {
  data?: any;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // 1. 读取用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('userInfo');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); }
      catch (e) { console.error('解析用户信息失败', e); }
    }
  }, []);

  const roleKey = user?.roleKey || 'admin';

  // 2. 拉取看板数据
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      try {
        const res = await getDashboardSummary({ role: roleKey });
        const resultData = (res as any)?.data || res;
        if (resultData) {
          setData(resultData);
        } else {
          message.error('获取看板数据失败');
        }
      } catch (error) {
        console.error('Dashboard Error:', error);
        message.error('看板网络请求异常，请检查网络');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [roleKey, user]);

  // 3. 加载中
  if (loading || !user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="看板数据加载中..." />
      </div>
    );
  }

  // 4. 权限逻辑
  const isSuper      = roleKey === 'admin' || roleKey === 'manager';
  const isConsultant = roleKey === 'consultant' || isSuper;
  const isReviewer   = roleKey === 'reviewer'   || isSuper;
  const isSales      = roleKey === 'sales'       || isSuper;

  return (
    // ✅ 去掉 background: '#f0f2f5'，与毛玻璃主题保持透明融合
    <div style={{ minHeight: '100%' }}>
      {/* ── 欢迎栏 ── */}
      <ErrorBoundary title="欢迎栏加载失败" subTitle="无法加载用户信息">
        <GlobalOverview user={user} dashboardData={data} />
      </ErrorBoundary>

      {/* ── 角色看板区域 ── */}
      <ErrorBoundary title="数据看板加载失败" subTitle="统计数据暂时无法获取，请刷新重试">
        <Row gutter={[16, 16]}>

          {/* 管理员 / 经理：全局统计 + 饼图 */}
          {isSuper && (
            <Col span={24}>
              <AdminView data={data?.adminStats || {}} />
            </Col>
          )}

          {/* 咨询专员：材料待办 */}
          {isConsultant && (
            <Col span={isSuper && isReviewer ? 12 : 24}>
              <ConsultantView data={data?.consultantTasks || []} />
            </Col>
          )}

          {/* 年审专员：预警列表 */}
          {isReviewer && (
            <Col span={isSuper && isConsultant ? 12 : 24}>
              <ReviewerView alerts={data?.annualReviewAlerts || []} />
            </Col>
          )}

          {/* 销售：业绩看板 */}
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