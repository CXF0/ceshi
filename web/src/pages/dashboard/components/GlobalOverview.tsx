/**
 * @file GlobalOverview.tsx
 * @desc 看板顶部欢迎栏 - 动态问候 + 快捷入口 + 最新公告
 * @version 2.1.0
 */
import React, { memo, useEffect, useState } from 'react';
import {
  Card, Row, Col, Typography, Avatar, Button, Space,
  Divider, Badge, Skeleton, Tooltip,
} from 'antd';
import {
  UserOutlined, FileAddOutlined, BellOutlined, RightOutlined,
  TeamOutlined, FileSearchOutlined, AuditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../../../services/notification';

const { Title, Text } = Typography;

// ── 角色 / 部门映射 ──────────────────────────────
const ROLE_MAP: Record<string, string> = {
  admin:      '超级管理员',
  manager:    '经理',
  sales:      '销售主管',
  consultant: '咨询顾问',
  reviewer:   '年审专员',
};

const DEPT_MAP: Record<number, string> = {
  1: '昆明分公司',
  2: '成都分公司',
  3: '总公司',
  4: '杭州分公司',
  5: '宣城总公司',
};

// ── 时段问候 ────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6)  return { text: '凌晨了，注意休息', emoji: '🌙' };
  if (h < 9)  return { text: '早安', emoji: '☀️' };
  if (h < 12) return { text: '上午好', emoji: '🌤' };
  if (h < 14) return { text: '中午好，记得吃饭', emoji: '🍱' };
  if (h < 18) return { text: '下午好', emoji: '☕' };
  return       { text: '晚上好', emoji: '🌙' };
};

// ── 快捷入口配置 ─────────────────────────────────
const getShortcuts = (roleKey: string) => {
  const base = [
    { label: '新增合同', icon: <FileAddOutlined />, path: '/contract', action: 'add' },
    { label: '客户录入', icon: <TeamOutlined />,    path: '/crm',      action: 'add' },
  ];
  if (roleKey === 'admin' || roleKey === 'manager') {
    base.push({ label: '用户管理', icon: <AuditOutlined />,     path: '/system/users',    action: 'view' });
    base.push({ label: '认证类型', icon: <FileSearchOutlined />, path: '/system/certification', action: 'view' });
  }
  if (roleKey === 'reviewer') {
    base.push({ label: '证书管理', icon: <FileSearchOutlined />, path: '/certificates', action: 'view' });
  }
  return base.slice(0, 4);
};

interface GlobalOverviewProps {
  user: any;
  dashboardData?: any; // 来自父级，含 activeProjects / pendingCount
}

const GlobalOverview: React.FC<GlobalOverviewProps> = memo(({ user, dashboardData }) => {
  const navigate = useNavigate();
  const [latestNotice, setLatestNotice] = useState<any>(null);
  const [noticeLoading, setNoticeLoading] = useState(true);

  // 从看板数据中读取真实统计
  const activeProjects = dashboardData?.adminStats?.activeProjects
    ?? dashboardData?.consultantTasks?.length
    ?? 0;
  const pendingCount = dashboardData?.consultantTasks?.filter(
    (t: any) => ['pending', 'drafting'].includes(t.material_status)
  ).length ?? 0;
  const alertCount = dashboardData?.annualReviewAlerts?.filter(
    (a: any) => {
      const days = a.endDate
        ? Math.ceil((new Date(a.endDate).getTime() - Date.now()) / 86400000)
        : 999;
      return days <= 30;
    }
  ).length ?? 0;

  // 获取最新公告
  useEffect(() => {
    const fetch = async () => {
      try {
        setNoticeLoading(true);
        const res = await getNotifications({ status: 1, pageSize: 1 });
        const list = Array.isArray(res) ? res : (res as any)?.data;
        if (list?.length > 0) setLatestNotice(list[0]);
      } catch {
        // 静默失败，不影响看板
      } finally {
        setNoticeLoading(false);
      }
    };
    fetch();
  }, []);

  const greeting = getGreeting();
  const shortcuts = getShortcuts(user?.roleKey || 'admin');

  const goToNotice = () => {
    if (latestNotice?.id) {
      navigate(`/system/notification/detail/${latestNotice.id}`);
    } else {
      navigate('/system/notification');
    }
  };

  return (
    <Card
      bordered={false}
      style={{ marginBottom: 16, borderRadius: 12 }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      {/* ── 第一行：欢迎信息 + 统计数字 ── */}
      <Row align="middle" gutter={24}>
        <Col flex="72px">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#71ccbc',
              fontSize: 28,
              boxShadow: '0 4px 14px rgba(113,204,188,0.4)',
            }}
          />
        </Col>
        <Col flex="auto">
          <Title level={4} style={{ marginBottom: 4, fontWeight: 600 }}>
            {greeting.emoji} {greeting.text}，{user?.nickname || '同事'}！
          </Title>
          <Space split={<Divider type="vertical" />} style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
            <Badge status="processing" color="#71ccbc" text={ROLE_MAP[user?.roleKey] || user?.roleName || '员工'} />
            <span>{DEPT_MAP[user?.deptId] || '正达认证'}</span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </Space>
        </Col>
        <Col>
          <Space size={32}>
            <Tooltip title="当前在办项目总数">
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/contract')}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>在办项目</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff', lineHeight: 1 }}>
                  {activeProjects}
                </div>
              </div>
            </Tooltip>
            <Tooltip title="待处理的材料起草任务">
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/contract')}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>待办任务</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: pendingCount > 0 ? '#ff4d4f' : '#52c41a', lineHeight: 1 }}>
                  {pendingCount}
                </div>
              </div>
            </Tooltip>
            <Tooltip title="30天内即将到期的证书">
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/certificates')}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>年审预警</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: alertCount > 0 ? '#faad14' : '#52c41a', lineHeight: 1 }}>
                  {alertCount}
                </div>
              </div>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* ── 第二行：快捷入口 + 最新公告 ── */}
      <Row justify="space-between" align="middle" wrap={false}>
        <Col>
          <Space size="small" wrap>
            <Text style={{ fontSize: 12, color: '#8c8c8c', marginRight: 4 }}>快捷入口：</Text>
            {shortcuts.map(s => (
              <Button
                key={s.path}
                size="small"
                type="dashed"
                icon={s.icon}
                onClick={() => navigate(s.path)}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                {s.label}
              </Button>
            ))}
          </Space>
        </Col>
        <Col style={{ flexShrink: 0, marginLeft: 16 }}>
          {noticeLoading ? (
            <Skeleton.Input size="small" active style={{ width: 200 }} />
          ) : (
            <Badge dot={!!latestNotice} offset={[-2, 2]}>
              <Text
                style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer' }}
                onClick={goToNotice}
              >
                <BellOutlined style={{ marginRight: 4 }} />
                系统通知：
                {latestNotice ? (
                  <span style={{ color: '#1890ff' }}>
                    {latestNotice.title?.length > 18
                      ? latestNotice.title.slice(0, 18) + '…'
                      : latestNotice.title}
                    <RightOutlined style={{ fontSize: 9, marginLeft: 4 }} />
                  </span>
                ) : (
                  <span style={{ color: '#bbb' }}>暂无最新通知</span>
                )}
              </Text>
            </Badge>
          )}
        </Col>
      </Row>
    </Card>
  );
});

export default GlobalOverview;