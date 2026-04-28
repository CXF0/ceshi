/**
 * @file ReviewerView.tsx
 * @desc 年审专员 - 证书年审到期预警，分级告警 + 跳转合同详情
 * @version 2.0.0
 */
import React from 'react';
import { Card, Table, Tag, Button, Tooltip, Empty, Space, Badge } from 'antd';
import {
  WarningOutlined, FireOutlined, ClockCircleOutlined,
  EyeOutlined, CheckCircleOutlined, AlertOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface ReviewerViewProps {
  alerts: any[];
}

// 预警等级计算
const getAlertLevel = (days: number) => {
  if (days < 0)  return { label: '已到期',  color: '#ff4d4f', bg: '#fff1f0', icon: <FireOutlined />,         level: 4 };
  if (days <= 7) return { label: '紧急预警', color: '#ff4d4f', bg: '#fff1f0', icon: <FireOutlined />,         level: 3 };
  if (days <= 15) return { label: '高度预警', color: '#fa8c16', bg: '#fff7e6', icon: <AlertOutlined />,        level: 2 };
  if (days <= 30) return { label: '预警提示', color: '#faad14', bg: '#fffbe6', icon: <WarningOutlined />,      level: 1 };
  return           { label: '正常',     color: '#52c41a', bg: '#f6ffed',  icon: <CheckCircleOutlined />,  level: 0 };
};

const ReviewerView: React.FC<ReviewerViewProps> = ({ alerts }) => {
  const navigate = useNavigate();

  // 计算剩余天数
  const enriched = alerts.map(item => {
    const endDate = item.endDate || item.expiry_date;
    const days = endDate
      ? Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
      : 999;
    return { ...item, _days: days, _level: getAlertLevel(days) };
  }).sort((a, b) => a._days - b._days); // 按紧迫程度排序

  // 统计各预警等级数量
  const urgentCount = enriched.filter(e => e._days <= 7).length;
  const highCount   = enriched.filter(e => e._days > 7 && e._days <= 15).length;
  const warnCount   = enriched.filter(e => e._days > 15 && e._days <= 30).length;

  const columns = [
    {
      title: '认证主体',
      key: 'customer',
      width: 150,
      ellipsis: true,
      render: (_: any, record: any) => {
        const name = record.customer?.name || record.customerName || '—';
        return (
          <Tooltip title={name}>
            <span style={{ fontWeight: 500, color: '#262626' }}>{name}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '合同编号',
      key: 'contractNo',
      width: 130,
      ellipsis: true,
      render: (_: any, record: any) => (
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#595959' }}>
          {record.contractNo || record.contract_no || '—'}
        </span>
      ),
    },
    {
      title: '到期日期',
      key: 'endDate',
      width: 110,
      render: (_: any, record: any) => {
        const date = record.endDate || record.expiry_date;
        if (!date) return <span style={{ color: '#bbb' }}>—</span>;
        return (
          <span style={{ fontSize: 12 }}>
            {dayjs(date).format('YYYY-MM-DD')}
          </span>
        );
      },
    },
    {
      title: '剩余天数',
      key: 'days',
      width: 110,
      sorter: (a: any, b: any) => a._days - b._days,
      render: (_: any, record: any) => {
        const { color, bg, label, icon } = record._level;
        const days = record._days;
        return (
          <Tag
            icon={icon}
            style={{
              color,
              background: bg,
              border: `1px solid ${color}40`,
              fontWeight: 600,
            }}
          >
            {days < 0 ? `已逾期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}
          </Tag>
        );
      },
    },
    {
      title: '预警等级',
      key: 'alertLevel',
      width: 90,
      render: (_: any, record: any) => {
        const { color, label } = record._level;
        return <span style={{ color, fontWeight: 600, fontSize: 12 }}>{label}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/contract/${record.id}`)}
          style={{ padding: '0 4px' }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      title={
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          <span>证书年审到期预警</span>
          {urgentCount > 0 && (
            <Badge count={urgentCount} style={{ backgroundColor: '#ff4d4f' }} title="紧急预警" />
          )}
          {highCount > 0 && (
            <Badge count={highCount} style={{ backgroundColor: '#fa8c16' }} title="高度预警" />
          )}
        </Space>
      }
      extra={
        alerts.length > 0 && (
          <Space size={4} style={{ fontSize: 11, color: '#8c8c8c' }}>
            <span style={{ color: '#ff4d4f' }}>紧急 {urgentCount}</span>
            <span>·</span>
            <span style={{ color: '#fa8c16' }}>高度 {highCount}</span>
            <span>·</span>
            <span style={{ color: '#faad14' }}>提示 {warnCount}</span>
          </Space>
        )
      }
    >
      {enriched.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#8c8c8c' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              30 天内无即将到期的证书 ✅
            </span>
          }
        />
      ) : (
        <Table
          dataSource={enriched}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 6, size: 'small', showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 660 }}
          onRow={(record) => ({
            style: record._days <= 7
              ? { background: '#fff1f0' }
              : record._days <= 15
              ? { background: '#fff7e6' }
              : {},
          })}
        />
      )}
    </Card>
  );
};

export default ReviewerView;