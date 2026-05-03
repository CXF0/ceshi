import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spin, message, Space, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import GlobalOverview from './components/GlobalOverview';
import AdminView from './components/AdminView';
import ConsultantView from './components/ConsultantView';
import ReviewerView from './components/ReviewerView';
import SalesView from './components/SalesView';
import request from '@/utils/request';

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

  const [baseData, setBaseData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminPeriod, setAdminPeriod] = useState('month');

  const [consultantData, setConsultantData] = useState<any[]>([]);
  const [reviewerData, setReviewerData] = useState<any[]>([]);

  const [salesData, setSalesData] = useState<any>(null);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState('month');
  const [salesUser, setSalesUser] = useState<string | undefined>();

  const [baseLoading, setBaseLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');

  const roleKey = user?.roleKey || '';
  const isSuper = roleKey === 'admin' || roleKey === 'manager';
  const isConsultant = roleKey === 'consultant' || isSuper;
  const isReviewer = roleKey === 'reviewer' || isSuper;
  const isSales = roleKey === 'sales' || isSuper;

  const fetchBase = useCallback(
    async (showLoading = true) => {
      if (!user) return;

      if (showLoading) {
        setBaseLoading(true);
      } else {
        setRefreshLoading(true);
      }

      try {
        const res: any = await request.get('/dashboard/summary', {
          params: { role: roleKey, period: adminPeriod },
        });

        const d = res?.data?.data || res?.data || res;
        setBaseData(d);
        setAdminData(d?.adminStats || null);

        if (isConsultant) setConsultantData(d?.consultantTasks || []);
        if (isReviewer) setReviewerData(d?.annualReviewAlerts || []);
        if (isSales) {
          setSalesUsers(d?.salesUsers || []);
          setSalesData(d?.salesStats || null);
        }

        setLastUpdatedAt(new Date().toLocaleString('zh-CN'));
      } catch {
        message.error('看板数据加载失败');
      } finally {
        if (showLoading) {
          setBaseLoading(false);
        } else {
          setRefreshLoading(false);
        }
      }
    },
    [user, roleKey, adminPeriod, isConsultant, isReviewer, isSales],
  );

  useEffect(() => {
    fetchBase(true);
  }, [fetchBase]);

  const [adminInited, setAdminInited] = useState(false);
  useEffect(() => {
    if (!adminInited) {
      setAdminInited(true);
      return;
    }
    if (!user || !isSuper) return;

    setAdminLoading(true);
    request
      .get('/dashboard/summary', { params: { role: roleKey, period: adminPeriod } })
      .then((res: any) => {
        const d = res?.data?.data || res?.data || res;
        setAdminData(d?.adminStats || null);
      })
      .catch(() => message.error('管理员统计加载失败'))
      .finally(() => setAdminLoading(false));
  }, [adminPeriod, adminInited, isSuper, roleKey, user]);

  const [salesInited, setSalesInited] = useState(false);
  useEffect(() => {
    if (!salesInited) {
      setSalesInited(true);
      return;
    }
    if (!user || !isSales) return;

    setSalesLoading(true);
    request
      .get('/dashboard/summary', {
        params: { role: roleKey, period: salesPeriod, salesUserId: salesUser },
      })
      .then((res: any) => {
        const d = res?.data?.data || res?.data || res;
        setSalesData(d?.salesStats || null);
        if (d?.salesUsers) setSalesUsers(d.salesUsers);
      })
      .catch(() => message.error('销售数据加载失败'))
      .finally(() => setSalesLoading(false));
  }, [salesPeriod, salesUser, salesInited, isSales, roleKey, user]);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%' }}>
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          业务看板
        </Typography.Title>
        <Space>
          {lastUpdatedAt ? (
            <Typography.Text type="secondary">最近更新：{lastUpdatedAt}</Typography.Text>
          ) : null}
          <Button
            icon={<ReloadOutlined />}
            loading={refreshLoading}
            onClick={() => fetchBase(false)}
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