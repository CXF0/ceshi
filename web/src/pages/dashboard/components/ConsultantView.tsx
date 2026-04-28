/**
 * @file ConsultantView.tsx
 * @desc 咨询专员 - 材料起草任务监控，支持状态色彩、跳转合同详情
 * @version 2.0.0
 */
import React from 'react';
import { Card, Table, Tag, Button, Space, Tooltip, Empty, Badge } from 'antd';
import {
  FileTextOutlined, EyeOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface ConsultantViewProps {
  data: any[];
}

// 材料状态映射
const MATERIAL_STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:     { label: '待起草', color: 'orange',  icon: <ClockCircleOutlined /> },
  drafting:    { label: '起草中', color: 'blue',    icon: <SyncOutlined spin /> },
  review:      { label: '待审核', color: 'purple',  icon: <ExclamationCircleOutlined /> },
  approved:    { label: '已审核', color: 'cyan',    icon: <CheckCircleOutlined /> },
  submitted:   { label: '已提交', color: 'green',   icon: <CheckCircleOutlined /> },
  rejected:    { label: '已退回', color: 'red',     icon: <ExclamationCircleOutlined /> },
};

// 合同状态映射
const CONTRACT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:   { label: '草稿',  color: 'default' },
  signed:  { label: '已签约', color: 'blue' },
  active:  { label: '执行中', color: 'green' },
  closed:  { label: '已结项', color: 'gray' },
};

const ConsultantView: React.FC<ConsultantViewProps> = ({ data }) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: '认证主体',
      key: 'customer',
      width: 160,
      ellipsis: true,
      render: (_: any, record: any) => {
        const name = record.customer?.name || record.client?.name || '—';
        return (
          <Tooltip title={name}>
            <span style={{ fontWeight: 500, color: '#262626' }}>{name}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '认证项目',
      key: 'certType',
      width: 130,
      ellipsis: true,
      render: (_: any, record: any) => {
        const type =
          record.certTypeDisplay ||
          record.certType ||
          record.certificationType?.type_name ||
          '—';
        return (
          <Tooltip title={type}>
            <Tag color="geekblue" style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {type}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '合同状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const s = CONTRACT_STATUS_MAP[status] || { label: status || '—', color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '材料状态',
      dataIndex: 'material_status',
      key: 'materialStatus',
      width: 100,
      render: (status: string) => {
        const s = MATERIAL_STATUS_MAP[status] || { label: status || '待起草', color: 'orange', icon: <ClockCircleOutlined /> };
        return (
          <Tag color={s.color} icon={s.icon}>
            {s.label}
          </Tag>
        );
      },
    },
    {
      title: '签约时间',
      key: 'signedDate',
      width: 110,
      render: (_: any, record: any) => {
        const date = record.signedDate || record.sign_date;
        if (!date) return <span style={{ color: '#bbb' }}>—</span>;
        const d = dayjs(date);
        return (
          <Tooltip title={d.format('YYYY-MM-DD')}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              {d.fromNow()}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
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

  // 统计未完成的任务数
  const pendingCount = data.filter(d =>
    ['pending', 'drafting', 'review'].includes(d.material_status)
  ).length;

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      title={
        <Space>
          <FileTextOutlined style={{ color: '#71ccbc' }} />
          <span>材料起草任务监控</span>
          {pendingCount > 0 && (
            <Badge
              count={pendingCount}
              style={{ backgroundColor: '#faad14' }}
              title={`${pendingCount} 项待处理`}
            />
          )}
        </Space>
      }
    >
      {data.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#8c8c8c' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              暂无待办任务，一切井然有序 ✨
            </span>
          }
        />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 6, size: 'small', showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 620 }}
          rowClassName={(record) =>
            record.material_status === 'rejected' ? 'row-danger' : ''
          }
          onRow={(record) => ({
            style: record.material_status === 'rejected'
              ? { background: '#fff1f0' }
              : {},
          })}
        />
      )}
    </Card>
  );
};

export default ConsultantView;