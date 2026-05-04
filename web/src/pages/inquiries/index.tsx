/**
 * @file src/pages/inquiries/index.tsx
 * @desc 后台「客户咨询」列表 — 展示咨询、标记跟进、登记回复
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Tag, Button, Space, Popconfirm, Drawer,
  Form, Input, Timeline, message, Badge, Select, Row, Col, Tooltip,
} from 'antd';
import {
  PhoneOutlined, UserOutlined, ClockCircleOutlined,
  CheckCircleOutlined, MessageOutlined, ReloadOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import dayjs from 'dayjs';

const STATUS_MAP = [
  { value: 0, label: '待跟进', color: 'orange' },
  { value: 1, label: '跟进中', color: 'blue'   },
  { value: 2, label: '已完成', color: 'green'  },
];

export default function InquiriesPage() {
  const [data, setData]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [params, setParams]     = useState({ page: 1, pageSize: 15, status: undefined as any });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent]   = useState<any>(null);
  const [replying, setReplying] = useState(false);
  const [replyForm] = Form.useForm();

  const userInfo = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; } })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/inquiries', { params });
      const d = res?.data?.data ?? res?.data ?? {};
      setData(d.list || []);
      setTotal(d.total || 0);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (record: any) => {
    setCurrent(record);
    setDrawerOpen(true);
    // 标记已读
    if (!record.isRead) {
      await request.patch('/inquiries/read', { ids: [record.id] }).catch(() => {});
      setData(prev => prev.map(r => r.id === record.id ? { ...r, isRead: 1 } : r));
    }
  };

  const handleFollow = async (record: any) => {
    try {
      const res: any = await request.patch(`/inquiries/${record.id}/follow`, {
        operatorId: userInfo.id || 0,
        operatorName: userInfo.nickname || '未知',
      });
      const updated = res?.data?.data ?? res?.data;
      setData(prev => prev.map(r => r.id === record.id ? updated : r));
      if (current?.id === record.id) setCurrent(updated);
      message.success('已标记跟进');
    } catch { message.error('操作失败'); }
  };

  const handleDone = async (record: any) => {
    try {
      const res: any = await request.patch(`/inquiries/${record.id}/done`);
      const updated = res?.data?.data ?? res?.data;
      setData(prev => prev.map(r => r.id === record.id ? updated : r));
      if (current?.id === record.id) setCurrent(updated);
      message.success('已标记完成');
    } catch { message.error('操作失败'); }
  };

  const handleReply = async () => {
    const { content } = await replyForm.validateFields();
    if (!current) return;
    setReplying(true);
    try {
      const res: any = await request.post(`/inquiries/${current.id}/reply`, {
        content,
        operatorId: userInfo.id || 0,
        operatorName: userInfo.nickname || '未知',
      });
      const updated = res?.data?.data ?? res?.data;
      setCurrent(updated);
      setData(prev => prev.map(r => r.id === current.id ? updated : r));
      replyForm.resetFields();
      message.success('回复已记录');
    } catch { message.error('操作失败'); }
    finally { setReplying(false); }
  };

  const columns = [
    {
      title: '状态', dataIndex: 'isRead', width: 56,
      render: (_: any, r: any) => (
        <Badge dot color={r.isRead ? 'transparent' : '#2563eb'}>
          {(() => { const s = STATUS_MAP.find(x => x.value === r.status); return <Tag color={s?.color}>{s?.label}</Tag>; })()}
        </Badge>
      ),
    },
    { title: '姓名', dataIndex: 'name', width: 80 },
    {
      title: '手机', dataIndex: 'phone', width: 130,
      render: (v: string) => <a href={`tel:${v}`} style={{ color: '#2563eb' }}><PhoneOutlined style={{ marginRight: 4 }} />{v}</a>,
    },
    { title: '咨询内容', dataIndex: 'content', ellipsis: true, render: (v: string) => v || <span style={{ color: '#ccc' }}>—</span> },
    { title: '来源', dataIndex: 'source', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '跟进人', width: 160,
      render: (_: any, r: any) => r.followName ? (
        <Tooltip title={`${dayjs(r.followAt).format('MM-DD HH:mm')} 标记跟进`}>
          <span><UserOutlined style={{ color: '#2563eb', marginRight: 4 }} />{r.followName}</span>
        </Tooltip>
      ) : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '提交时间', dataIndex: 'createdAt', width: 140,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => openDetail(r)}>详情</Button>
          {r.status === 0 && (
            <Button size="small" type="primary" onClick={() => handleFollow(r)}>标记跟进</Button>
          )}
          {r.status === 1 && (
            <Popconfirm title="确认标记为已完成？" onConfirm={() => handleDone(r)}>
              <Button size="small" icon={<CheckCircleOutlined />}>完成</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <MessageOutlined style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 700 }}>客户咨询</span>
          <Badge count={data.filter(d => !d.isRead).length} color="#2563eb" />
        </Space>
      }
      extra={<Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>}
    >
      {/* 筛选栏 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col>
          <Select allowClear placeholder="全部状态" style={{ width: 120 }}
            options={STATUS_MAP.map(s => ({ label: s.label, value: s.value }))}
            onChange={v => setParams(p => ({ ...p, status: v, page: 1 }))}
          />
        </Col>
        <Col>
          <Select allowClear placeholder="已读/未读" style={{ width: 120 }}
            options={[{ label: '未读', value: 0 }, { label: '已读', value: 1 }]}
            onChange={v => setParams(p => ({ ...p, isRead: v, page: 1 } as any))}
          />
        </Col>
      </Row>

      <Table
        rowKey="id" columns={columns} dataSource={data} loading={loading}
        scroll={{ x: 900 }}
        rowClassName={r => !r.isRead ? 'ant-table-row-unread' : ''}
        pagination={{
          current: params.page, pageSize: params.pageSize, total,
          showTotal: t => `共 ${t} 条`,
          onChange: (p, s) => setParams(prev => ({ ...prev, page: p, pageSize: s })),
        }}
      />

      {/* 详情 & 回复抽屉 */}
      <Drawer
        title={
          <Space>
            <span>咨询详情</span>
            {current && (() => { const s = STATUS_MAP.find(x => x.value === current.status); return <Tag color={s?.color}>{s?.label}</Tag>; })()}
          </Space>
        }
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          current?.status === 0 ? (
            <Button type="primary" size="small" onClick={() => handleFollow(current)}>标记跟进</Button>
          ) : current?.status === 1 ? (
            <Popconfirm title="标记为已完成？" onConfirm={() => handleDone(current)}>
              <Button size="small" icon={<CheckCircleOutlined />}>标记完成</Button>
            </Popconfirm>
          ) : null
        }
      >
        {current && (
          <>
            {/* 基本信息 */}
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: '姓名', value: current.name },
                  { label: '手机', value: <a href={`tel:${current.phone}`}>{current.phone}</a> },
                  { label: '来源', value: current.source },
                  { label: '提交时间', value: dayjs(current.createdAt).format('YYYY-MM-DD HH:mm') },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 14, color: '#111827' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {current.content && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 4 }}>咨询内容</div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{current.content}</div>
                </div>
              )}
            </div>

            {/* 跟进信息 */}
            {current.followName && (
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <UserOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                    {current.followName} 已跟进
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {dayjs(current.followAt).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
              </div>
            )}

            {/* 沟通记录 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#111827' }}>
                沟通记录 {current.replies?.length > 0 && <Tag color="blue">{current.replies.length}条</Tag>}
              </div>
              {(!current.replies || current.replies.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>暂无沟通记录</div>
              ) : (
                <Timeline
                  items={[...current.replies].reverse().map((r: any) => ({
                    dot: <UserOutlined style={{ fontSize: 12 }} />,
                    color: '#2563eb',
                    children: (
                      <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{r.operator}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{dayjs(r.createdAt).format('MM-DD HH:mm')}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{r.content}</div>
                      </div>
                    ),
                  }))}
                />
              )}
            </div>

            {/* 新增回复 */}
            {current.status !== 2 && (
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#111827' }}>登记沟通情况</div>
                <Form form={replyForm} layout="vertical">
                  <Form.Item name="content" rules={[{ required: true, message: '请填写沟通内容' }]}>
                    <Input.TextArea rows={3} placeholder="记录本次沟通情况，如：客户需要 ISO9001，预计月底签约..." />
                  </Form.Item>
                  <Button type="primary" loading={replying} onClick={handleReply} block>
                    提交记录
                  </Button>
                </Form>
              </div>
            )}
          </>
        )}
      </Drawer>
    </Card>
  );
}