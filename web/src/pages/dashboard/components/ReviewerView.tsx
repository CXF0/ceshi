/**
 * @file web/src/pages/dashboard/components/ReviewerView.tsx
 * @version 3.0.0 [2026-04-29]
 * @desc 证书年审预警：按紧急程度倒序（daysLeft 升序），颜色分级
 */
import React from 'react';
import { Card, Table, Tag, Button, Tooltip, Empty, Space, Badge, Divider } from 'antd';
import { WarningOutlined, FireOutlined, CheckCircleOutlined, AlertOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ReviewerViewProps {
  alerts: any[];
}

const getAlertLevel = (days: number) => {
  if (days < 0)   return { label: '已过期',   color: '#ff4d4f', bg: '#fff1f0', icon: <FireOutlined />,    level: 4 };
  if (days <= 30) return { label: '紧急预警', color: '#ff4d4f', bg: '#fff1f0', icon: <FireOutlined />,    level: 3 };
  if (days <= 60) return { label: '高度预警', color: '#fa8c16', bg: '#fff7e6', icon: <AlertOutlined />,   level: 2 };
  if (days <= 120) return { label: '预警提示', color: '#faad14', bg: '#fffbe6', icon: <WarningOutlined />, level: 1 };
  return           { label: '正常',    color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleOutlined />, level: 0 };
};

const ReviewerView: React.FC<ReviewerViewProps> = ({ alerts }) => {
  const navigate = useNavigate();

  // 已在后端按 expiry_date ASC 排序（最紧急在前），前端直接展示即可
  const urgentCount = alerts.filter(a => (a.daysLeft ?? 999) <= 30).length;
  const highCount   = alerts.filter(a => (a.daysLeft ?? 999) > 30 && (a.daysLeft ?? 999) <= 60).length;

  const columns = [
    {
      title: '认证主体',
      dataIndex: 'customerName',
      width: 150,
      ellipsis: true,
      render: (name: string) => <Tooltip title={name}><span style={{ fontWeight: 500 }}>{name || '—'}</span></Tooltip>,
    },
    {
      title: '认证类型',
      dataIndex: 'certTypeName',
      width: 140,
      ellipsis: true,
      render: (v: string) => <Tooltip title={v}><Tag color="geekblue">{v || '—'}</Tag></Tooltip>,
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      width: 110,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '剩余天数',
      dataIndex: 'daysLeft',
      width: 120,
      render: (days: number) => {
        const { color, bg, label } = getAlertLevel(days ?? 999);
        return (
          <Tag style={{ color, background: bg, border: `1px solid ${color}40`, fontWeight: 600 }}>
            {days < 0 ? `已逾期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}
          </Tag>
        );
      },
    },
    {
      title: '预警等级',
      dataIndex: 'daysLeft',
      width: 80,
      render: (days: number) => {
        const { color, label } = getAlertLevel(days ?? 999);
        return <span style={{ color, fontWeight: 600, fontSize: 12 }}>{label}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/certificates`)} style={{ padding: '0 4px' }}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}
      title={
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          <span>证书年审到期预警</span>
          {urgentCount > 0 && <Badge count={urgentCount} style={{ backgroundColor: '#ff4d4f' }} title="紧急预警" />}
          {highCount > 0   && <Badge count={highCount}   style={{ backgroundColor: '#fa8c16' }} title="高度预警" />}
        </Space>
      }
      extra={alerts.length > 0 && (
        <Space size={4} style={{ fontSize: 11, color: '#8c8c8c' }}>
          <span style={{ color: '#ff4d4f' }}>紧急 {urgentCount}</span>·
          <span style={{ color: '#fa8c16' }}>高度 {highCount}</span>
        </Space>
      )}
    >
      {alerts.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#8c8c8c' }}><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />180 天内无即将到期的证书 ✅</span>} />
      ) : (
        <Table dataSource={alerts} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 8, size: 'small', showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 620 }}
          onRow={(record) => ({
            style: (record.daysLeft ?? 999) <= 30 ? { background: '#fff1f0' }
              : (record.daysLeft ?? 999) <= 60 ? { background: '#fff7e6' } : {},
          })}
        />
      )}
    </Card>
  );
};

export default ReviewerView;