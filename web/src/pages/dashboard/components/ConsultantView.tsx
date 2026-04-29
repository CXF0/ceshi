/**
 * @file web/src/pages/dashboard/components/ConsultantView.tsx
 * @version 3.0.0 [2026-04-29]
 * @desc 材料起草任务监控，支持跳转合同详情
 */
import React from 'react';
import { Card, Table, Tag, Button, Space, Tooltip, Empty, Badge } from 'antd';
import { FileTextOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ConsultantViewProps {
  data: any[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:  { label: '草稿（在签）', color: 'orange' },
  signed: { label: '已签约',       color: 'blue' },
  active: { label: '执行中',       color: 'green' },
  closed: { label: '已结项',       color: 'default' },
};

const ConsultantView: React.FC<ConsultantViewProps> = ({ data }) => {
  const navigate = useNavigate();

  const pendingCount = data.filter(d => ['draft', 'signed'].includes(d.status)).length;

  const columns = [
    {
      title: '认证主体',
      key: 'customer',
      width: 160,
      ellipsis: true,
      render: (_: any, record: any) => {
        const name = record.customer?.name || '—';
        return <Tooltip title={name}><span style={{ fontWeight: 500, color: '#262626' }}>{name}</span></Tooltip>;
      },
    },
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v || '—'}</span>,
    },
    {
      title: '合同状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { label: status || '—', color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '所属公司',
      key: 'dept',
      width: 110,
      render: (_: any, record: any) => {
        const name = record.dept?.deptName || '—';
        return <Tag color="cyan">{name}</Tag>;
      },
    },
    {
      title: '签约日期',
      dataIndex: 'signedDate',
      width: 110,
      render: (v: string) => v || <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/contract/${record.id}`)} style={{ padding: '0 4px' }}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}
      title={
        <Space>
          <FileTextOutlined style={{ color: '#71ccbc' }} />
          <span>材料起草任务监控</span>
          {pendingCount > 0 && <Badge count={pendingCount} style={{ backgroundColor: '#faad14' }} title={`${pendingCount} 项待处理`} />}
        </Space>
      }
    >
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#8c8c8c' }}><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />暂无待办任务 ✨</span>} />
      ) : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 6, size: 'small', showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 680 }} />
      )}
    </Card>
  );
};

export default ConsultantView;