import React, { useState, useEffect } from 'react';
import {
  Table, Input, Card, Tag, message, Space, Row, Col,
  Select, Button, Drawer, Form, InputNumber, Descriptions,
  Tabs, List, Empty, Typography, Spin, Modal, Tooltip, Timeline,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined, PhoneOutlined,
  SearchOutlined, EyeOutlined, PlusOutlined, EditOutlined,
  BankOutlined, WalletOutlined, ExclamationCircleOutlined,
  DeleteOutlined, StopOutlined, CheckCircleOutlined, ReloadOutlined,
  BankFilled,
} from '@ant-design/icons';
import { CrmCustomerApi, CrmAccountApi } from '@/services/crm';
import PermButton from '@/components/PermButton';
import request from '@/utils/request';
import { useDeptOptions } from '@/hooks/useDeptOptions';

const { Text } = Typography;

export const INDUSTRY_OPTIONS = [
  { label: '农林牧渔', value: 'agriculture' },
  { label: '采矿业', value: 'mining' },
  { label: '制造业', value: 'manufacturing' },
  { label: '电力/燃气/水', value: 'utility' },
  { label: '建筑业', value: 'construction' },
  { label: '批发零售', value: 'wholesale' },
  { label: '交通运输/仓储', value: 'transport' },
  { label: '信息技术/互联网', value: 'tech' },
  { label: '金融业', value: 'finance' },
  { label: '房地产业', value: 'real_estate' },
  { label: '租赁/商务服务', value: 'leasing' },
  { label: '科研/技术服务', value: 'research' },
  { label: '水利/环境/公共设施', value: 'environment' },
  { label: '居民服务/餐饮住宿', value: 'lifestyle' },
  { label: '教育', value: 'education' },
  { label: '卫生/社会工作', value: 'healthcare' },
  { label: '文化/体育/娱乐', value: 'culture' },
  { label: '公共管理', value: 'public' },
  { label: '国际组织', value: 'international' },
  { label: '其他', value: 'other' },
];

export const LEVEL_OPTIONS = [
  { label: 'VIP客户', value: 'vip', color: 'gold' },
  { label: '普通客户', value: 'common', color: 'blue' },
  { label: '渠道客户', value: 'channel', color: 'cyan' },
];

interface CustomerAccount {
  id: number;
  type: 'corporate' | 'private';
  accountName: string;
  usciCode?: string;
  addressPhone?: string;
  bankName?: string;
  bankAccount?: string;
  bankCode?: string;
  alipayAccount?: string;
  isDefault: boolean;
}

interface MaintenanceRecord { id: number; maintainer: string; content: string; maintainedAt: string; }

interface CustomerRecord {
  id: number;
  name: string;
  deptId: string;
  dept?: { id: string; deptName: string };
  usciCode: string;
  scaleCount: number;
  address: string;
  contactPerson: string;
  contactPhone: string;
  source: string;
  industry: string;
  level: string;
  status: number;
  accounts?: CustomerAccount[];
  maintenances?: MaintenanceRecord[];
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

const TH = (label: string) => <span style={{ whiteSpace: 'nowrap' }}>{label}</span>;

const CustomerList: React.FC = () => {
  const [form] = Form.useForm();
  const { deptOptions, deptMap } = useDeptOptions(); // ← 动态获取公司列表

  const [data, setData] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [addVisible, setAddVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<CustomerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [maintenanceForm] = Form.useForm();
  const [accountForm] = Form.useForm();
  const [accountVisible, setAccountVisible] = useState(false);

  const [filterName, setFilterName]           = useState('');
  const [filterIndustry, setFilterIndustry]   = useState<string | undefined>();
  const [filterLevel, setFilterLevel]         = useState<string | undefined>();
  const [filterSource, setFilterSource]       = useState<string | undefined>();
  const [filterDeptId, setFilterDeptId]       = useState<string | undefined>(); // ← 新增

  const [params, setParams] = useState<any>({
    page: 1, pageSize: 10,
    name: '', source: undefined,
    industry: undefined, level: undefined,
    status: 1,
  });

  const sourceOptions = [
    { label: '老客户推荐', value: '老客户推荐' },
    { label: '电销获客', value: '电销获客' },
    { label: '网络获客', value: '网络获客' },
    { label: '渠道推荐', value: '渠道推荐' },
    { label: '业务拜访', value: '业务拜访' },
    { label: '其他', value: '其他' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await CrmCustomerApi.findAll(params);
      setData(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params]);

  const handleSearch = () => {
    setParams((prev: any) => ({
      ...prev, page: 1,
      name:     filterName,
      industry: filterIndustry,
      level:    filterLevel,
      source:   filterSource,
      deptId:   filterDeptId,   // ← 新增
    }));
  };

  const handleReset = () => {
    setFilterName('');
    setFilterIndustry(undefined);
    setFilterLevel(undefined);
    setFilterSource(undefined);
    setFilterDeptId(undefined); // ← 新增
    setParams({
      page: 1, pageSize: 10,
      name: '', source: undefined,
      industry: undefined, level: undefined,
      status: 1,
    });
  };

  const handleShowDetail = async (record: CustomerRecord) => {
    setCurrentRow(record);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const res = await CrmCustomerApi.findOne(record.id);
      setCurrentRow(res.data);
    } catch {
      message.error('获取客户详细资料失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteAccount = (acc: CustomerAccount) => {
    Modal.confirm({
      title: '确认删除账户？',
      icon: <ExclamationCircleOutlined />,
      content: `即将删除 [${acc.accountName}]，删除后无法恢复。`,
      okText: '确认删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          await CrmAccountApi.remove(acc.id);
          message.success('账户已移除');
          if (currentRow) handleShowDetail(currentRow);
          fetchData();
        } catch { message.error('删除失败'); }
      },
    });
  };

  const handleSetDefaultAccount = async (id: number) => {
    try {
      await CrmAccountApi.setDefault(id);
      message.success('已设为默认账户');
      if (currentRow) handleShowDetail(currentRow);
    } catch { message.error('设置失败'); }
  };

  const handleToggleStatus = (record: CustomerRecord) => {
    const isDisabling = record.status === 1;
    Modal.confirm({
      title: isDisabling ? '确认禁用该客户？' : '确认启用该客户？',
      icon: <ExclamationCircleOutlined />,
      content: isDisabling
        ? `禁用后「${record.name}」将不在默认列表中显示，历史数据保留。`
        : `启用后「${record.name}」将恢复正常显示。`,
      okText: isDisabling ? '确认禁用' : '确认启用',
      okType: isDisabling ? 'danger' : 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.patch(`/crm/customers/${record.id}/status`, { status: isDisabling ? 0 : 1 });
          message.success(isDisabling ? '已禁用' : '已启用');
          fetchData();
        } catch { message.error('操作失败'); }
      },
    });
  };

  const handleDeleteCustomer = (record: CustomerRecord) => {
    Modal.confirm({
      title: '确认删除客户？',
      icon: <ExclamationCircleOutlined />,
      content: `即将删除客户「${record.name}」，数据将被归档，不可恢复。`,
      okText: '确认删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          await CrmCustomerApi.remove(record.id);
          message.success('客户已删除');
          fetchData();
        } catch { message.error('删除失败'); }
      },
    });
  };

  const showAddDrawer = () => {
    setIsEdit(false);
    setCurrentRow(null);
    form.resetFields();
    setAddVisible(true);
  };

  const showEditDrawer = (record: CustomerRecord) => {
    setIsEdit(true);
    setCurrentRow(record);
    form.setFieldsValue(record);
    setAddVisible(true);
  };

  const onFinishSave = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit && currentRow) {
        await CrmCustomerApi.update(currentRow.id, values);
        message.success('更新成功');
      } else {
        await CrmCustomerApi.create(values);
        message.success('新增成功');
      }
      setAddVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaintenance = (maintenanceId: number) => {
    if (!currentRow) return;
    Modal.confirm({
      title: '确认删除维护记录？',
      onOk: async () => {
        await CrmCustomerApi.removeMaintenance(currentRow.id, maintenanceId);
        message.success('维护记录已删除');
        handleShowDetail(currentRow);
      },
    });
  };

  const handleAddAccount = async (values: any) => {
    if (!currentRow) return;
    await CrmAccountApi.create({ ...values, customerId: currentRow.id });
    message.success('账户新增成功');
    setAccountVisible(false);
    accountForm.resetFields();
    handleShowDetail(currentRow);
    fetchData();
  };  

  const columns: ColumnsType<CustomerRecord> = [
    {
      title: TH('企业信息'),
      dataIndex: 'name',
      width: 240,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 15, color: '#4260e7ff' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>信用代码: {record.usciCode || '--'}</div>
        </div>
      ),
    },
    {
      title: TH('客户等级'),
      dataIndex: 'level',
      width: 100,
      render: (val) => {
        const target = LEVEL_OPTIONS.find(o => o.value === val) || { label: '普通客户', color: 'blue' };
        return <Tag color={target.color}>{target.label}</Tag>;
      },
    },
    {
      title: TH('所属行业'),
      dataIndex: 'industry',
      width: 130,
      render: (val) => INDUSTRY_OPTIONS.find(o => o.value === val)?.label || '--',
    },
    {
      title: TH('联系人'),
      dataIndex: 'contactPerson',
      width: 140,
      render: (text, record) => (
        <div>
          <Space><UserOutlined style={{ color: '#888' }} />{text || '-'}</Space>
          <div style={{ fontSize: 12, color: '#888' }}><PhoneOutlined /> {record.contactPhone || '-'}</div>
        </div>
      ),
    },
    {
      title: TH('账户数'),
      key: 'acc_count',
      width: 72,
      align: 'center',
      render: (_, record) => (
        <Tag color={record.accounts?.length ? 'green' : 'default'}>{record.accounts?.length || 0}</Tag>
      ),
    },
    {
      title: TH('客户来源'),
      dataIndex: 'source',
      width: 100,
      render: (text) => text ? <Tag color="purple">{text}</Tag> : '-',
    },
    // ✅ 地址列 → 所属公司列
    {
      title: TH('所属公司'),
      dataIndex: 'deptId',
      width: 160,
      render: (deptId: string, record: any) => {
        const name = record.dept?.deptName || deptMap[deptId] || deptId;
        return <Tag color="cyan">{name}</Tag>;
      },
    },
    {
      title: TH('状态'),
      dataIndex: 'status',
      width: 88,
      render: (status: number, record: any) => (
        <Tooltip title={status === 1 ? '点击禁用' : '点击启用'}>
          <Tag
            icon={status === 1 ? <CheckCircleOutlined /> : <StopOutlined />}
            color={status === 1 ? 'success' : 'default'}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleToggleStatus(record)}
          >
            {status === 1 ? '正常' : '已禁用'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: TH('操作'),
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <PermButton perm="/crm:view" type="link" size="small" icon={<EyeOutlined />}
            onClick={() => handleShowDetail(record)}>详情</PermButton>
          <PermButton perm="/crm:edit" type="link" size="small" icon={<EditOutlined />}
            onClick={() => showEditDrawer(record)}>编辑</PermButton>
          <PermButton perm="/crm:delete" type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDeleteCustomer(record)}>删除</PermButton>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <div style={{ width: 4, height: 16, backgroundColor: '#52c41a', borderRadius: 2 }} />
          <span>客户资源档案</span>
        </Space>
      }
      extra={
        <PermButton perm="/crm:add" type="primary" icon={<PlusOutlined />} onClick={showAddDrawer}>
          新增客户
        </PermButton>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input
              placeholder="搜索企业全称..."
              prefix={<SearchOutlined />}
              allowClear
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col flex="130px">
            <Select placeholder="行业" style={{ width: '100%' }} allowClear
              value={filterIndustry} onChange={val => setFilterIndustry(val)}
              options={INDUSTRY_OPTIONS} />
          </Col>
          <Col flex="120px">
            <Select placeholder="等级" style={{ width: '100%' }} allowClear
              value={filterLevel} onChange={val => setFilterLevel(val)}
              options={LEVEL_OPTIONS} />
          </Col>
          <Col flex="120px">
            <Select placeholder="来源" style={{ width: '100%' }} allowClear
              value={filterSource} onChange={val => setFilterSource(val)}
              options={sourceOptions} />
          </Col>
          {/* ✅ 新增：公司筛选（有多个公司时才显示） */}
          {deptOptions.length > 1 && (
            <Col flex="240px">
              <Select placeholder="所属公司" style={{ width: '100%' }} allowClear
                value={filterDeptId} onChange={val => setFilterDeptId(val)}
                options={deptOptions} />
            </Col>
          )}
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        rowClassName={(record) => record.status === 0 ? 'row-disabled' : ''}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共找到 ${t} 家客户`,
          onChange: (p, s) => setParams((prev: any) => ({ ...prev, page: p, pageSize: s })),
        }}
      />

      <style>{`
        .row-disabled td { opacity: 0.5; }
        .row-disabled td:last-child { opacity: 1; }
      `}</style>

      {/* ── 详情抽屉 ── */}
      <Drawer
        title={<span><EyeOutlined /> 客户详细资料</span>}
        width={720} onClose={() => setDetailVisible(false)}
        open={detailVisible} destroyOnClose
      >
        <Spin spinning={detailLoading}>
          {currentRow && (
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="基础资料" key="1">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="企业全称" span={2} labelStyle={{ width: 120 }}>
                    <Space>
                      <Text strong style={{ color: '#1890ff' }}>{currentRow.name}</Text>
                      <Tag color={currentRow.status === 1 ? 'success' : 'default'}>
                        {currentRow.status === 1 ? '正常' : '已禁用'}
                      </Tag>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="客户等级">
                    <Tag color={LEVEL_OPTIONS.find(o => o.value === currentRow.level)?.color}>
                      {LEVEL_OPTIONS.find(o => o.value === currentRow.level)?.label || '普通客户'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="所属行业">
                    {INDUSTRY_OPTIONS.find(o => o.value === currentRow.industry)?.label || '--'}
                  </Descriptions.Item>
                  <Descriptions.Item label="所属公司">
                    <Tag color="cyan">{(currentRow as any).dept?.deptName || deptMap[(currentRow as any).deptId] || '--'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="社会信用代码">{currentRow.usciCode || '--'}</Descriptions.Item>
                  <Descriptions.Item label="联系人">{currentRow.contactPerson || '--'}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{currentRow.contactPhone || '--'}</Descriptions.Item>
                  <Descriptions.Item label="客户来源">{currentRow.source || '--'}</Descriptions.Item>
                  <Descriptions.Item label="人员规模">{currentRow.scaleCount} 人</Descriptions.Item>
                  <Descriptions.Item label="经营地址" span={2}>{currentRow.address || '--'}</Descriptions.Item>
                  <Descriptions.Item label="创建人">{currentRow.createdBy || '--'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{currentRow.createdAt ? new Date(currentRow.createdAt).toLocaleString() : '--'}</Descriptions.Item>
                  <Descriptions.Item label="更新人">{currentRow.updatedBy || '--'}</Descriptions.Item>
                  <Descriptions.Item label="更新时间">{currentRow.updatedAt ? new Date(currentRow.updatedAt).toLocaleString() : '--'}</Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>

              <Tabs.TabPane tab={`财务账户 (${currentRow.accounts?.length || 0})`} key="2">
                <List
                  grid={{ gutter: 16, column: 1 }}
                  dataSource={currentRow.accounts || []}
                  renderItem={(acc) => {
                    const copyText = acc.type === 'corporate'
                      ? `单位名称：${acc.accountName}\n统一信用代码：${acc.usciCode || '--'}\n地址及电话：${acc.addressPhone || '--'}\n开户行及账号：${acc.bankName || '--'} ${acc.bankAccount || '--'}\n行号：${acc.bankCode || '--'}`
                      : `账户名称：${acc.accountName}\n银行卡号：${acc.bankAccount || '--'}\n开户银行：${acc.bankName || '--'}\n支付宝：${acc.alipayAccount || '--'}`;
                    return (
                      <List.Item>
                        <Card size="small" variant="outlined"
                          style={{ borderLeft: acc.isDefault ? '4px solid #52c41a' : '4px solid #d9d9d9' }}
                          title={
                            <Space>
                              {acc.type === 'corporate'
                                ? <BankOutlined style={{ color: '#1890ff' }} />
                                : <UserOutlined style={{ color: '#fa8c16' }} />}
                              <span style={{ fontWeight: 'bold' }}>{acc.accountName}</span>
                              {acc.isDefault && <Tag color="green">默认</Tag>}
                            </Space>
                          }
                          extra={
                            <Space split={<div style={{ width: 1, height: 12, backgroundColor: '#eee' }} />}>
                              {!acc.isDefault && (
                                <Typography.Link onClick={() => handleSetDefaultAccount(acc.id)}>设为默认</Typography.Link>
                              )}
                              <Typography.Link onClick={() => { navigator.clipboard.writeText(copyText); message.success('已复制'); }}>复制</Typography.Link>
                              <Typography.Link type="danger" onClick={() => handleDeleteAccount(acc)}>删除</Typography.Link>
                            </Space>
                          }
                        >
                          {acc.type === 'corporate' ? (
                            <Descriptions size="small" column={1} colon={false}>
                              <Descriptions.Item label={<Text type="secondary">账户类型</Text>}>{acc.type === 'corporate' ? '企业' : '个人'}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">开户银行</Text>}>{acc.bankName}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">银行账号</Text>}>{acc.bankAccount}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">银行行号</Text>}>{acc.bankCode}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">地址电话</Text>}>{acc.addressPhone}</Descriptions.Item>
                            </Descriptions>
                          ) : (
                            <Descriptions size="small" column={1} colon={false}>
                              <Descriptions.Item label={<Text type="secondary">持卡姓名</Text>}>{acc.accountName}</Descriptions.Item>
                              {acc.bankAccount && (<>
                                <Descriptions.Item label={<Text type="secondary">银行名称</Text>}>{acc.bankName}</Descriptions.Item>
                                <Descriptions.Item label={<Text type="secondary">银行卡号</Text>}>{acc.bankAccount}</Descriptions.Item>
                              </>)}
                              {acc.alipayAccount && (
                                <Descriptions.Item label={<Space><WalletOutlined style={{ color: '#1296db' }} />支付宝</Space>}>{acc.alipayAccount}</Descriptions.Item>
                              )}
                            </Descriptions>
                          )}
                        </Card>
                      </List.Item>
                    );
                  }}
                  locale={{ emptyText: <Empty description="暂无关联账户信息" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
                <PermButton perm="/crm:edit" type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => setAccountVisible(true)}>新增账户</PermButton>
              </Tabs.TabPane>
              <Tabs.TabPane tab={`维护记录 (${currentRow.maintenances?.length || 0})`} key="3">
                <Form form={maintenanceForm} layout="inline" onFinish={async (v) => {
                  if (!currentRow) return;
                  await CrmCustomerApi.addMaintenance(currentRow.id, v.content);
                  maintenanceForm.resetFields();
                  message.success('维护记录已添加');
                  handleShowDetail(currentRow);
                }}>
                  <Form.Item name="content" rules={[{ required: true, message: '请输入维护内容' }]} style={{ flex: 1 }}>
                    <Input placeholder="请输入维护内容" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">新增记录</Button>
                  </Form.Item>
                </Form>
                <Timeline style={{ marginTop: 16 }}>
                  {(currentRow.maintenances || []).map((item) => (
                    <Timeline.Item key={item.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><Text strong>{item.maintainer}</Text> <Text type="secondary">{new Date(item.maintainedAt).toLocaleString()}</Text></div>
                        <PermButton perm="/crm:delete" type="link" danger size="small" onClick={() => handleDeleteMaintenance(item.id)}>删除</PermButton>
                      </div>
                      <div>{item.content}</div>
                    </Timeline.Item>
                  ))}
                </Timeline>
                {(!currentRow.maintenances || currentRow.maintenances.length === 0) && <Empty description="暂无维护记录" />}
              </Tabs.TabPane>
            </Tabs>
          )}
        </Spin>
      </Drawer>

      {/* ── 新增/编辑抽屉 ── */}
      <Drawer
        title={isEdit ? <span><EditOutlined /> 修改客户档案</span> : <span><PlusOutlined /> 新增客户档案</span>}
        width={560} onClose={() => setAddVisible(false)} open={addVisible} destroyOnClose
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setAddVisible(false)}>取消</Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>保存数据</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinishSave} initialValues={{ level: 'common', scaleCount: 0 }}>
          <Form.Item name="name" label="企业全称" rules={[{ required: true, message: '请输入企业全称' }]}>
            <Input placeholder="请输入完整的企业工商登记名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label="客户等级" rules={[{ required: true }]}>
                <Select options={LEVEL_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="所属行业" rules={[{ required: true }]}>
                <Select options={INDUSTRY_OPTIONS} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="usciCode" label="统一社会信用代码">
            <Input placeholder="18位社会信用代码" maxLength={18} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactPerson" label="联系人"><Input prefix={<UserOutlined />} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPhone" label="联系电话"><Input prefix={<PhoneOutlined />} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source" label="客户来源" rules={[{ required: true }]}>
                <Select options={sourceOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scaleCount" label="人员规模">
                <InputNumber style={{ width: '100%' }} min={0} addonAfter="人" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="详细地址">
            <Input.TextArea rows={3} placeholder="请输入企业的详细通讯地址或经营地址" />
          </Form.Item>
        </Form>
      </Drawer>
      <Drawer
        title={<span><PlusOutlined /> 新增财务账户</span>}
        width={520}
        onClose={() => setAccountVisible(false)}
        open={accountVisible}
        destroyOnClose
        footer={<Space style={{ float: 'right' }}><Button onClick={() => setAccountVisible(false)}>取消</Button><Button type="primary" onClick={() => accountForm.submit()}>保存</Button></Space>}
      >
        <Form form={accountForm} layout="vertical" onFinish={handleAddAccount} initialValues={{ type: 'corporate', isDefault: false }}>
          <Form.Item name="type" label="账户类型" rules={[{ required: true }]}>
            <Select options={[{ label: '对公账户', value: 'corporate' }, { label: '个人账户', value: 'private' }]} />
          </Form.Item>
          <Form.Item name="accountName" label="账户名称" rules={[{ required: true, message: '请输入账户名称' }]}><Input /></Form.Item>
          <Form.Item name="bankName" label="开户银行"><Input /></Form.Item>
          <Form.Item name="bankAccount" label="银行账号"><Input /></Form.Item>
          <Form.Item name="bankCode" label="联行号"><Input /></Form.Item>
          <Form.Item name="alipayAccount" label="支付宝账号"><Input /></Form.Item>
          <Form.Item name="isDefault" label="默认账户"><Select options={[{ label: '否', value: false }, { label: '是', value: true }]} /></Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};

export default CustomerList;