/**
 * @file web/src/pages/certificates/index.tsx
 * @version 2.2.0 [2026-04-28]
 * @desc 修复：
 *   1. 去掉逾期/预警行背景色（有状态列已够用）
 *   2. 录入/编辑使用新版 CertificateModal
 *   3. 认证类型筛选下拉宽度增加 1.5 倍（200 → 300）
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Card, Button, Space, Tag, Modal, message,
  Tooltip, Row, Col, Input, Select, DatePicker, Divider, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FileImageOutlined,
  SearchOutlined, ReloadOutlined, SafetyCertificateOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';
import CertificateModal from './components/CertificateModal';

const TH = (label: string) => <span style={{ whiteSpace: 'nowrap' }}>{label}</span>;

const getExpiryInfo = (expiryDate: string) => {
  const days = dayjs(expiryDate).diff(dayjs().startOf('day'), 'day');
  if (days < 0)    return { days, color: '#ff4d4f', bg: '#fff1f0', level: 'expired' };
  if (days <= 60)  return { days, color: '#ff4d4f', bg: '#fff1f0', level: 'danger'  };
  if (days <= 120) return { days, color: '#faad14', bg: '#fffbe6', level: 'warning' };
  if (days <= 180) return { days, color: '#1677ff', bg: '#e6f4ff', level: 'notice'  };
  return             { days, color: '#52c41a', bg: '#f6ffed',  level: 'normal'  };
};

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  valid:    { color: 'success', text: '有效'     },
  expiring: { color: 'warning', text: '即将到期' },
  expired:  { color: 'error',   text: '已过期'   },
  revoked:  { color: 'default', text: '已撤销'   },
};

const STAT_ITEMS = [
  { key: 'expired', label: '已过期',    color: '#ff4d4f', bg: '#fff1f0' },
  { key: 'danger',  label: '≤60天',     color: '#ff4d4f', bg: '#fff1f0' },
  { key: 'warning', label: '61~120天',  color: '#faad14', bg: '#fffbe6' },
  { key: 'notice',  label: '121~180天', color: '#1677ff', bg: '#e6f4ff' },
  { key: 'normal',  label: '>180天',    color: '#52c41a', bg: '#f6ffed' },
];

const { RangePicker } = DatePicker;

const CertificateList: React.FC = () => {
  const [loading, setLoading]               = useState(false);
  const [data, setData]                     = useState<any[]>([]);
  const [total, setTotal]                   = useState(0);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingRecord, setEditingRecord]   = useState<any>(null);
  const [certTypeOptions, setCertTypeOptions] = useState<{ label: string; value: number }[]>([]);

  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterCertNumber, setFilterCertNumber]     = useState('');
  const [filterCategoryId, setFilterCategoryId]     = useState<number | undefined>();
  const [filterStatus, setFilterStatus]             = useState<string | undefined>();
  const [filterExpiryRange, setFilterExpiryRange]   = useState<[string, string] | null>(null);

  const [params, setParams] = useState<any>({ page: 1, pageSize: 15 });

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await request.get('/cert-types');
        const list: any[] = res?.data?.data || res?.data || [];
        setCertTypeOptions(list.map((i: any) => ({
          label: `${i.parent_name} · ${i.type_name}`,
          value: i.id,
        })));
      } catch {}
    };
    load();
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/certificates', { params });
      const d = res?.data?.data || res?.data || res;
      setData(d.items || (Array.isArray(d) ? d : []));
      setTotal(d.total || 0);
    } catch {
      message.error('加载列表失败');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSearch = () => {
    setParams({
      page: 1, pageSize: 15,
      customerName:       filterCustomerName || undefined,
      certificate_number: filterCertNumber   || undefined,
      category_id:        filterCategoryId,
      status:             filterStatus,
      expiryStart:        filterExpiryRange?.[0] || undefined,
      expiryEnd:          filterExpiryRange?.[1] || undefined,
    });
  };

  const handleReset = () => {
    setFilterCustomerName('');
    setFilterCertNumber('');
    setFilterCategoryId(undefined);
    setFilterStatus(undefined);
    setFilterExpiryRange(null);
    setParams({ page: 1, pageSize: 15 });
  };

  const handleDelete = (id: string, certNo: string) => {
    Modal.confirm({
      title: '确定删除该证书记录？',
      icon: <ExclamationCircleOutlined />,
      content: `证书「${certNo}」删除后不可恢复`,
      okText: '确认删除', okType: 'danger',
      onOk: async () => {
        try {
          await request.delete(`/certificates/${id}`);
          message.success('删除成功');
          fetchList();
        } catch { message.error('删除失败'); }
      },
    });
  };

  const stats = data.reduce((acc, item) => {
    if (!item.expiry_date) return acc;
    const { level } = getExpiryInfo(item.expiry_date);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const columns: ColumnsType<any> = [
    {
      title: TH('认证主体'),
      key: 'customer',
      width: 190,
      ellipsis: true,
      render: (_, record) => {
        const name = record.customer?.name || record.customerName || null;
        return name ? (
          <Tooltip title={name}>
            <span style={{ fontWeight: 500, color: '#1677ff' }}>{name}</span>
          </Tooltip>
        ) : (
          <span style={{ color: '#bbb', fontSize: 11 }}>ID: {String(record.customer_id).slice(0, 8)}…</span>
        );
      },
    },
    {
      title: TH('证书编号'),
      dataIndex: 'certificate_number',
      width: 155,
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
        </Tooltip>
      ),
    },
    {
      title: TH('认证类型'),
      key: 'category',
      width: 175,
      render: (_, record) => {
        const typeName   = record.category?.type_name   || record.category?.name || '—';
        const parentName = record.category?.parent_name || '';
        return (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 500 }}>{typeName}</div>
            {parentName && <div style={{ fontSize: 11, color: '#8c8c8c' }}>{parentName}</div>}
          </div>
        );
      },
    },
    {
      title: TH('颁发机构'),
      dataIndex: 'issuer',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || <span style={{ color: '#d9d9d9' }}>—</span>,
    },
    {
      title: TH('有效期'),
      key: 'date_range',
      width: 195,
      render: (_, record) => (
        <span style={{ fontSize: 12, color: '#595959' }}>
          {record.issue_date}
          <span style={{ margin: '0 4px', color: '#d9d9d9' }}>→</span>
          {record.expiry_date}
        </span>
      ),
    },
    {
      title: TH('剩余天数'),
      dataIndex: 'expiry_date',
      width: 115,
      sorter: (a, b) => dayjs(a.expiry_date).unix() - dayjs(b.expiry_date).unix(),
      render: (expiryDate: string) => {
        if (!expiryDate) return '—';
        const { days, color, bg } = getExpiryInfo(expiryDate);
        return (
          <Tag style={{ color, background: bg, border: `1px solid ${color}40`, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
            {days < 0 ? `已逾期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}
          </Tag>
        );
      },
    },
    {
      title: TH('证书状态'),
      dataIndex: 'status',
      width: 90,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: TH('附件'),
      dataIndex: 'file_url',
      width: 60,
      align: 'center' as const,
      render: (url: string) =>
        url ? (
          <Tooltip title="查看证书附件">
            <Button type="link" size="small"
              icon={<FileImageOutlined style={{ color: '#71ccbc' }} />}
              onClick={() => window.open(url, '_blank')}
            />
          </Tooltip>
        ) : <span style={{ color: '#d9d9d9', fontSize: 11 }}>无</span>,
    },
    {
      title: TH('操作'),
      key: 'action',
      fixed: 'right' as const,
      width: 130,
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.certificate_number)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      title={
        <Space size={12} wrap>
          <Space>
            <SafetyCertificateOutlined style={{ color: '#71ccbc' }} />
            <span>证书管理</span>
            <Badge count={total} style={{ backgroundColor: '#71ccbc' }} />
          </Space>
          <Divider type="vertical" style={{ height: 16 }} />
          {STAT_ITEMS.map(({ key, label, color, bg }) => (
            <div key={key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 10px', borderRadius: 6,
              background: bg, border: `1px solid ${color}30`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, color: '#595959' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{stats[key] || 0}</span>
            </div>
          ))}
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}>
          录入证书
        </Button>
      }
    >
      {/* ── 筛选栏 ── */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
        <Col flex="180px">
          <Input placeholder="认证主体名称" prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={filterCustomerName}
            onChange={e => setFilterCustomerName(e.target.value)} onPressEnter={handleSearch} />
        </Col>
        <Col flex="150px">
          <Input placeholder="证书编号" prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            allowClear value={filterCertNumber}
            onChange={e => setFilterCertNumber(e.target.value)} onPressEnter={handleSearch} />
        </Col>
        {/* ✅ 修复3：认证类型下拉宽度从 200 增加到 300（1.5倍） */}
        <Col flex="300px">
          <Select placeholder="认证类型" style={{ width: '100%' }} allowClear showSearch
            optionFilterProp="label" value={filterCategoryId}
            onChange={v => setFilterCategoryId(v)} options={certTypeOptions} />
        </Col>
        <Col flex="120px">
          <Select placeholder="证书状态" style={{ width: '100%' }} allowClear
            value={filterStatus} onChange={v => setFilterStatus(v)}
            options={[
              { label: '有效',     value: 'valid'    },
              { label: '即将到期', value: 'expiring' },
              { label: '已过期',   value: 'expired'  },
              { label: '已撤销',   value: 'revoked'  },
            ]} />
        </Col>
        <Col flex="230px">
          <RangePicker placeholder={['到期开始', '到期结束']} style={{ width: '100%' }}
            value={filterExpiryRange ? [dayjs(filterExpiryRange[0]), dayjs(filterExpiryRange[1])] : null}
            onChange={dates => setFilterExpiryRange(
              dates ? [dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')] : null
            )} />
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '0 0 16px' }} />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        // ✅ 修复1：去掉 onRow 行背景色
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 张证书`,
          onChange: (p, s) => setParams((prev: any) => ({ ...prev, page: p, pageSize: s })),
        }}
      />
    <CertificateModal
        open={isModalOpen}
        initialValues={editingRecord}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => { setIsModalOpen(false); fetchList(); }}
      />
    </Card>
  );
};

export default CertificateList;