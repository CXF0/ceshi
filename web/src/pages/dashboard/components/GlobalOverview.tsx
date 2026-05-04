/**
 * @file web/src/pages/dashboard/components/GlobalOverview.tsx
 * @version 3.2.0 [2026-05-04]
 * @desc 公告区域交互升级：点击 Bell 弹出 Drawer，展示用户可见公告卡片列表，点卡片跳详情
 */
import React, { memo, useEffect, useState, useCallback } from 'react';
import {
  Card, Row, Col, Avatar, Button, Space, Divider,
  Badge, Skeleton, Tooltip, Drawer, List, Tag, Empty, Spin,
} from 'antd';
import {
  UserOutlined, FileAddOutlined, BellOutlined, RightOutlined,
  TeamOutlined, FileSearchOutlined, AuditOutlined,
  SafetyCertificateOutlined, ApartmentOutlined,
  ClockCircleOutlined, EyeOutlined, FireOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import request from '@/utils/request';

const ROLE_MAP: Record<string, string> = {
  admin:        '超级管理员',
  head_manager: '总部管理员',
  manager:      '区域经理',
  sales:        '客户经理',
  consultant:   '咨询专员',
  reviewer:     '年审专员',
};

const TYPE_CONFIG: Record<number, { color: string; text: string }> = {
  1: { color: 'blue',    text: '系统公告' },
  2: { color: 'orange',  text: '任务提醒' },
  3: { color: 'magenta', text: '活动通知' },
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

const ALL_SHORTCUTS = [
  { label: '起草合同', icon: <FileAddOutlined />,          path: '/contract',             perm: '/contract:add' },
  { label: '客户录入', icon: <TeamOutlined />,              path: '/crm',                  perm: '/crm:add' },
  { label: '录入证书', icon: <SafetyCertificateOutlined />, path: '/certificates',         perm: '/certificates:add' },
  { label: '用户管理', icon: <AuditOutlined />,             path: '/system/users',         perm: '/system/users:edit' },
  { label: '角色管理', icon: <SafetyCertificateOutlined />, path: '/system/roles',         perm: '/system/roles:edit' },
  { label: '公司管理', icon: <ApartmentOutlined />,         path: '/system/depts',         perm: '/system/roles:edit' },
  { label: '认证类型', icon: <FileSearchOutlined />,        path: '/system/certification', perm: '/system/certification:add' },
];

interface Props {
  user: any;
  dashboardData?: any;
}

const GlobalOverview: React.FC<Props> = memo(({ user, dashboardData }) => {
  const navigate = useNavigate();
  const { has, isAdmin } = usePermission();

  // ── 统计数字 ──────────────────────────────────────────────
  const adminStats     = dashboardData?.adminStats;
  const activeProjects = adminStats?.activeProjects
    ?? dashboardData?.consultantTasks?.filter((t: any) => t.status !== 'closed')?.length ?? 0;
  const draftContracts = adminStats?.draftContracts
    ?? dashboardData?.consultantTasks?.filter((t: any) => t.status === 'draft')?.length ?? 0;
  const alertCount = dashboardData?.annualReviewAlerts
    ?.filter((a: any) => (a.daysLeft ?? 999) <= 30).length ?? 0;
  const deptName = dashboardData?.deptName || user?.deptName || '正达认证';

  // ── 最新一条公告（仅用于 Bell 旁边的预览文字）────────────
  const [latestNotice, setLatestNotice] = useState<any>(null);
  const [noticeLoading, setNoticeLoading] = useState(true);

  // ── 公告抽屉 ──────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [noticeList, setNoticeList]       = useState<any[]>([]);
  const [listLoading, setListLoading]     = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);

  // 加载最新一条（仅预览）
  useEffect(() => {
    const load = async () => {
      try {
        setNoticeLoading(true);
        // 调公开列表接口取最新一条
        const res: any = await request.get('/notifications', { params: { status: 1, pageSize: 1 } });
        const list = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data : [];
        if (list.length > 0) {
          setLatestNotice(list[0]);
          setUnreadCount(1); // 有公告就显示红点
        }
      } catch {} finally { setNoticeLoading(false); }
    };
    load();
  }, []);

  // 打开抽屉时加载当前用户可见公告列表
  const loadNoticeList = useCallback(async () => {
    setListLoading(true);
    try {
      // 优先用 /notifications/my（需登录，返回用户可见范围）
      const res: any = await request.get('/notifications/my');
      const list = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data : [];
      setNoticeList(list);
    } catch {
      // fallback：公开列表
      try {
        const res: any = await request.get('/notifications', { params: { status: 1, pageSize: 20 } });
        const list = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data : [];
        setNoticeList(list);
      } catch {}
    } finally { setListLoading(false); }
  }, []);

  const handleBellClick = () => {
    setDrawerOpen(true);
    setUnreadCount(0); // 打开后清除红点
    loadNoticeList();
  };

  const handleNoticeClick = (id: number) => {
    setDrawerOpen(false);
    navigate(`/system/notification/detail/${id}?from=dashboard`);
  };

  const visibleShortcuts = ALL_SHORTCUTS
    .filter(s => isAdmin || has(s.perm))
    .slice(0, 4);

  const greeting = getGreeting();

  return (
    <>
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
                  <div style={{ fontSize: 24, fontWeight: 700, color: alertCount > 0 ? '#ff4d4f' : '#52c41a', lineHeight: 1 }}>{alertCount}</div>
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

          {/* ── 公告 Bell 入口 ── */}
          <Col style={{ flexShrink: 0, marginLeft: 16 }}>
            {noticeLoading ? (
              <Skeleton.Input size="small" active style={{ width: 200 }} />
            ) : (
              <Badge count={unreadCount} size="small" offset={[-4, 2]}>
                <span
                  style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer', userSelect: 'none' }}
                  onClick={handleBellClick}
                >
                  <BellOutlined style={{ marginRight: 4, fontSize: 14 }} />
                  系统通知：
                  {latestNotice ? (
                    <span style={{ color: '#1890ff' }}>
                      {latestNotice.title?.length > 18
                        ? latestNotice.title.slice(0, 18) + '…'
                        : latestNotice.title}
                      <RightOutlined style={{ fontSize: 9, marginLeft: 4 }} />
                    </span>
                  ) : <span style={{ color: '#bbb' }}>暂无最新通知</span>}
                </span>
              </Badge>
            )}
          </Col>
        </Row>
      </Card>

      {/* ── 公告列表抽屉 ───────────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <BellOutlined style={{ color: '#1890ff' }} />
            <span>系统通知</span>
            {noticeList.length > 0 && (
              <Badge count={noticeList.length} style={{ backgroundColor: '#71ccbc' }} />
            )}
          </Space>
        }
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ padding: '8px 0' }}
      >
        {listLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin tip="加载中..." />
          </div>
        ) : noticeList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知公告"
            style={{ marginTop: 60 }}
          />
        ) : (
          <List
            dataSource={noticeList}
            renderItem={(item: any) => {
              const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG[1];
              const isUrgent = item.priority > 0;
              const timeStr  = item.createTime
                ? new Date(item.createTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <List.Item
                  onClick={() => handleNoticeClick(item.id)}
                  style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f7ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: '100%' }}>
                    {/* 标题行 */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      {isUrgent && (
                        <FireOutlined style={{ color: '#ff4d4f', fontSize: 13, marginTop: 2, flexShrink: 0 }} />
                      )}
                      <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#262626',
                        lineHeight: '20px',
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.title}
                      </span>
                      <RightOutlined style={{ fontSize: 10, color: '#bbb', marginTop: 4, flexShrink: 0 }} />
                    </div>

                    {/* 元信息行 */}
                    <Space size={12} style={{ fontSize: 11, color: '#8c8c8c' }}>
                      <Tag color={typeConf.color} style={{ fontSize: 11, padding: '0 6px', lineHeight: '18px', margin: 0 }}>
                        {typeConf.text}
                      </Tag>
                      {timeStr && (
                        <span>
                          <ClockCircleOutlined style={{ marginRight: 3 }} />
                          {timeStr}
                        </span>
                      )}
                      {item.viewCount !== undefined && (
                        <span>
                          <EyeOutlined style={{ marginRight: 3 }} />
                          {item.viewCount}
                        </span>
                      )}
                    </Space>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    </>
  );
});

export default GlobalOverview;