/**
 * @file web/src/pages/dashboard/components/GlobalOverview.tsx
 * @version 3.0.0 [2026-04-29]
 */
import React, { memo, useEffect, useState } from 'react';
import { Card, Row, Col, Avatar, Button, Space, Divider, Badge, Skeleton, Tooltip } from 'antd';
import {
  UserOutlined, FileAddOutlined, BellOutlined, RightOutlined,
  TeamOutlined, FileSearchOutlined, AuditOutlined,
  SafetyCertificateOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import request from '@/utils/request';

const ROLE_MAP: Record<string, string> = {
  admin: '超级管理员', manager: '经理',
  sales: '销售主管', consultant: '咨询顾问', reviewer: '年审专员',
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6)  return { text: '凌晨了，注意休息', emoji: '🌙' };
  if (h < 9)  return { text: '早安', emoji: '☀️' };
  if (h < 12) return { text: '上午好', emoji: '🌤' };
  if (h < 14) return { text: '中午好，记得吃饭', emoji: '🍱' };
  if (h < 18) return { text: '下午好', emoji: '☕' };
  return       { text: '晚上好', emoji: '🌙' };
};

// 快捷入口配置（含权限 key）
const ALL_SHORTCUTS = [
  { label: '起草合同', icon: <FileAddOutlined />,          path: '/contract',            perm: '/contract:add' },
  { label: '客户录入', icon: <TeamOutlined />,              path: '/crm',                 perm: '/crm:add' },
  { label: '录入证书', icon: <SafetyCertificateOutlined />, path: '/certificates',        perm: '/certificates:add' },
  { label: '用户管理', icon: <AuditOutlined />,             path: '/system/users',        perm: '/system/users:edit' },
  { label: '角色管理', icon: <SafetyCertificateOutlined />, path: '/system/roles',        perm: '/system/roles:edit' },
  { label: '公司管理', icon: <ApartmentOutlined />,         path: '/system/depts',        perm: '/system/roles:edit' },
  { label: '认证类型', icon: <FileSearchOutlined />,        path: '/system/certification',perm: '/system/certification:add' },
];

interface Props {
  user: any;
  dashboardData?: any;
}

const GlobalOverview: React.FC<Props> = memo(({ user, dashboardData }) => {
  const navigate = useNavigate();
  const { has, isAdmin } = usePermission();
  const [latestNotice, setLatestNotice] = useState<any>(null);
  const [noticeLoading, setNoticeLoading] = useState(true);

  // 统计数字（来自 dashboardData）
  const adminStats    = dashboardData?.adminStats;
  const activeProjects = adminStats?.activeProjects ?? dashboardData?.consultantTasks?.filter((t: any) => t.status !== 'closed')?.length ?? 0;
  const draftContracts = adminStats?.draftContracts ?? dashboardData?.consultantTasks?.filter((t: any) => t.status === 'draft')?.length ?? 0;
  const alertCount     = dashboardData?.annualReviewAlerts?.filter((a: any) => (a.daysLeft ?? 999) <= 30).length ?? 0;

  // 公司名（从 dashboardData 取，fallback 硬编码）
  const deptName = dashboardData?.deptName || user?.deptName || '正达认证';

  // 最新公告
  useEffect(() => {
    const load = async () => {
      try {
        setNoticeLoading(true);
        const res: any = await request.get('/notifications', { params: { status: 1, pageSize: 1 } });
        const list = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data : [];
        if (list.length > 0) setLatestNotice(list[0]);
      } catch {} finally { setNoticeLoading(false); }
    };
    load();
  }, []);

  // 过滤有权限的快捷入口（最多展示 4 个）
  const visibleShortcuts = ALL_SHORTCUTS
    .filter(s => isAdmin || has(s.perm))
    .slice(0, 4);

  const greeting = getGreeting();

  return (
    <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: '20px 24px' }}>
      <Row align="middle" gutter={24}>
        <Col flex="72px">
          <Avatar size={64} icon={<UserOutlined />}
            style={{ backgroundColor: '#71ccbc', fontSize: 28, boxShadow: '0 4px 14px rgba(113,204,188,0.4)' }} />
        </Col>
        <Col flex="auto">
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {greeting.emoji} {greeting.text}，{user?.nickname || '同事'}！
          </div>
          <Space split={<Divider type="vertical" />} style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
            <Badge status="processing" color="#71ccbc" text={ROLE_MAP[user?.roleKey] || user?.roleName || '员工'} />
            <span>{deptName}</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </Space>
        </Col>
        {/* 统计数字 */}
        <Col>
          <Space size={28}>
            <Tooltip title="未完结合同（已签约+执行中）">
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/contract')}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>未完结合同</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff', lineHeight: 1 }}>{activeProjects}</div>
              </div>
            </Tooltip>
            <Tooltip title="草稿中的合同（在签）">
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/contract')}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>在签合同</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fa8c16', lineHeight: 1 }}>{draftContracts}</div>
              </div>
            </Tooltip>
            <Tooltip title="30天内即将到期的证书">
              <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/certificates')}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>年审预警</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: alertCount > 0 ? '#faad14' : '#52c41a', lineHeight: 1 }}>{alertCount}</div>
              </div>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      <Row justify="space-between" align="middle">
        <Col>
          <Space size="small" wrap>
            <span style={{ fontSize: 12, color: '#8c8c8c', marginRight: 4 }}>快捷入口：</span>
            {visibleShortcuts.map(s => (
              <Button key={s.path} size="small" type="dashed" icon={s.icon}
                onClick={() => navigate(s.path)} style={{ borderRadius: 6, fontSize: 12 }}>
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
              <span style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer' }}
                onClick={() => navigate('/system/notification')}>
                <BellOutlined style={{ marginRight: 4 }} />
                系统通知：
                {latestNotice ? (
                  <span style={{ color: '#1890ff' }}>
                    {latestNotice.title?.length > 18 ? latestNotice.title.slice(0, 18) + '…' : latestNotice.title}
                    <RightOutlined style={{ fontSize: 9, marginLeft: 4 }} />
                  </span>
                ) : <span style={{ color: '#bbb' }}>暂无最新通知</span>}
              </span>
            </Badge>
          )}
        </Col>
      </Row>
    </Card>
  );
});

export default GlobalOverview;