/**
 * @file web/src/pages/dashboard/components/ReviewerView.tsx
 * @version 3.1.0 [2026-04-29]
 * @desc 优化3：去掉行红色背景；优化2：列宽合理分配，ellipsis 防超出
 */
import React from 'react';
import { Card, Table, Tag, Button, Tooltip, Empty, Space, Badge } from 'antd';
import {
  WarningOutlined, FireOutlined, CheckCircleOutlined,
  AlertOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ReviewerViewProps {
  alerts: any[];
}

const getAlertLevel = (days: number) => {
  if (days < 0)    return { label: '已过期',   color: '#ff4d4f', bg: '#fff1f0', icon: <FireOutlined /> };
  if (days <= 30)  return { label: '紧急预警', color: '#ff4d4f', bg: '#fff1f0', icon: <FireOutlined /> };
  if (days <= 60)  return { label: '高度预警', color: '#fa8c16', bg: '#fff7e6', icon: <AlertOutlined /> };
  if (days <= 120) return { label: '预警提示', color: '#faad14', bg: '#fffbe6', icon: <WarningOutlined /> };
  return           { label: '关注',    color: '#1677ff', bg: '#e6f4ff', icon: <WarningOutlined /> };
};

const ReviewerView: React.FC<ReviewerViewProps> = ({ alerts }) => {
  const navigate   = useNavigate();
  const urgentCount = alerts.filter(a => (a.daysLeft ?? 999) <= 30).length;
  const highCount   = alerts.filter(a => (a.daysLeft ?? 999) > 30 && (a.daysLeft ?? 999) <= 60).length;

  const columns = [
    {
      title: '认证主体',
      dataIndex: 'customerName',
      width: 140,
      ellipsis: true,
      render: (name: string) => (
        <Tooltip title={name} placement="topLeft">
          <span style={{ fontWeight: 500 }}>{name || '—'}</span>
        </Tooltip>
      ),
    },
    {
      title: '认证类型',
      dataIndex: 'certTypeName',
      width: 130,
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v} placement="topLeft">
          <Tag color="geekblue" style={{ fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {v || '—'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      width: 100,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '剩余天数',
      dataIndex: 'daysLeft',
      width: 100,
      render: (days: number) => {
        const { color, bg } = getAlertLevel(days ?? 999);
        return (
          <Tag style={{ color, background: bg, border: `1px solid ${color}40`, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>
            {days < 0 ? `已逾期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}
          </Tag>
        );
      },
    },
    // {
    //   title: '等级',
    //   dataIndex: 'daysLeft',
    //   width: 72,
    //   render: (days: number) => {
    //     const { color, label } = getAlertLevel(days ?? 999);
    //     return <span style={{ color, fontWeight: 600, fontSize: 11 }}>{label}</span>;
    //   },
    // },
    {
      title: '操作',
      key: 'action',
      width: 48,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => navigate('/certificates')}
          style={{ padding: '0 2px', fontSize: 12 }} >
                    详情
        </Button>
      ),
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}
      title={
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          <span>证书年审到期预警</span>
          {urgentCount > 0 && <Badge count={urgentCount} style={{ backgroundColor: '#ff4d4f' }} />}
          {highCount > 0   && <Badge count={highCount}   style={{ backgroundColor: '#fa8c16' }} />}
        </Space>
      }
      extra={alerts.length > 0 && (
        <span style={{ fontSize: 11, color: '#8c8c8c' }}>
          <span style={{ color: '#ff4d4f' }}>紧急 {urgentCount}</span>
          {' · '}
          <span style={{ color: '#fa8c16' }}>高度 {highCount}</span>
        </span>
      )}
    >
      {alerts.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#8c8c8c' }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />180天内无即将到期的证书
          </span>} />
      ) : (
        <Table
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 600 }}
          pagination={{ pageSize: 10, size: 'small', showTotal: t => `共 ${t} 条` }}
          // ✅ 优化3：去掉行背景色
        />
      )}
    </Card>
  );
};

export default ReviewerView;