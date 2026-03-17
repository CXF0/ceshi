import React, { useState, useEffect } from 'react';
import { 
  Table, Input, Card, Tag, message, Space, Row, Col, 
  Select, Button, Drawer, Form, InputNumber, Descriptions, 
  Tabs, List, Empty, Typography, Spin, Modal // 💡 增加了 Modal
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  UserOutlined, PhoneOutlined, EnvironmentOutlined, 
  SearchOutlined, EyeOutlined, PlusOutlined, EditOutlined,
  BankOutlined, CreditCardOutlined, WalletOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
// 💡 修改点 1：使用你配置好的别名和封装好的 API
import { CrmCustomerApi, CrmAccountApi } from '@/services/crm'; 

const { Text } = Typography;

// 💡 行业与等级配置 (保持不变)
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

// 💡 定义账户接口
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

interface CustomerRecord {
  id: number;
  name: string;
  deptId: string;
  usciCode: string;
  scaleCount: number;
  address: string;
  contactPerson: string;
  contactPhone: string;
  source: string;
  industry: string; 
  level: string;    
  accounts?: CustomerAccount[]; 
}

const CustomerList: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  const [addVisible, setAddVisible] = useState(false);     
  const [detailVisible, setDetailVisible] = useState(false); 
  const [currentRow, setCurrentRow] = useState<CustomerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  const [detailLoading, setDetailLoading] = useState(false);

  const [params, setParams] = useState({ 
    page: 1, 
    pageSize: 10, 
    name: '',
    source: undefined as string | undefined,
    industry: undefined as string | undefined, 
    level: undefined as string | undefined      
  });

  const sourceOptions = [
    { label: '老客户推荐', value: '老客户推荐' },
    { label: '电销获客', value: '电销获客' },
    { label: '网络获客', value: '网络获客' },
    { label: '渠道推荐', value: '渠道推荐' },
    { label: '业务拜访', value: '业务拜访' },
    { label: '其他', value: '其他' },
  ];

  // 💡 修改点 2：替换为封装好的 CrmCustomerApi.findAll
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await CrmCustomerApi.findAll(params);
      setData(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (error: any) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params]);

  // 💡 修改点 3：替换为封装好的 CrmCustomerApi.findOne
  const handleShowDetail = async (record: CustomerRecord) => {
    setCurrentRow(record); 
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const res = await CrmCustomerApi.findOne(record.id);
      setCurrentRow(res.data);
    } catch (error: any) {
      message.error('获取客户详细账户资料失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 💡 修改点 4：新增删除账户的交互方法
  const handleDeleteAccount = (acc: CustomerAccount) => {
    Modal.confirm({
      title: '确认删除账户？',
      icon: <ExclamationCircleOutlined />,
      content: `即将删除 [${acc.accountName}]，删除后无法恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await CrmAccountApi.remove(acc.id);
          message.success('账户已移除');
          // 💡 重新触发详情查询，刷新账户列表
          if (currentRow) handleShowDetail(currentRow);
          fetchData(); // 顺便同步一下列表页的“账户数”Tag
        } catch (error: any) {
          message.error('删除失败');
        }
      },
    });
  };

  // 💡 修改点 5：新增设为默认账户的快捷方法
  const handleSetDefaultAccount = async (id: number) => {
    try {
      await CrmAccountApi.setDefault(id);
      message.success('已设为默认账户');
      if (currentRow) handleShowDetail(currentRow);
    } catch (error: any) {
      message.error('设置失败');
    }
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

  // 💡 修改点 6：替换保存逻辑
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

  const columns: ColumnsType<CustomerRecord> = [
    { 
      title: '企业信息', 
      dataIndex: 'name', 
      width: 300,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 15, color: '#4260e7ff' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>信用代码: {record.usciCode || '--'}</div>
        </div>
      )
    },
    {
      title: '客户等级', 
      dataIndex: 'level',
      width: 120,
      render: (val) => {
        const target = LEVEL_OPTIONS.find(o => o.value === val) || { label: '普通客户', color: 'blue' };
        return <Tag color={target.color}>{target.label}</Tag>;
      }
    },
    {
      title: '所属行业', 
      dataIndex: 'industry',
      width: 140,
      render: (val) => INDUSTRY_OPTIONS.find(o => o.value === val)?.label || '--'
    },
    { 
      title: '联系人', 
      dataIndex: 'contactPerson',
      render: (text, record) => (
        <div>
          <Space><UserOutlined style={{ color: '#888' }} />{text || '-'}</Space>
          <div style={{ fontSize: 12, color: '#888' }}><PhoneOutlined /> {record.contactPhone || '-'}</div>
        </div>
      )
    },
    { 
      title: '账户数', 
      key: 'acc_count',
      width: 80,
      align: 'center',
      render: (_, record) => <Tag color={record.accounts?.length ? 'green' : 'default'}>{record.accounts?.length || 0}</Tag>
    },
    { 
      title: '所属分部', 
      dataIndex: 'deptId',
      render: (id) => {
        const map: any = { '1': { name: '昆明分部', color: 'cyan' }, '2': { name: '西安分部', color: 'geekblue' }, '3': { name: '成都分部', color: 'orange' } };
        const item = map[id] || { name: '其他', color: 'default' };
        return <Tag color={item.color}>{item.name}</Tag>;
      }
    },
    { 
      title: '客户来源', 
      dataIndex: 'source',
      render: (text) => text ? <Tag color="purple">{text}</Tag> : '-'
    },
    { 
      title: '地址', 
      dataIndex: 'address',
      ellipsis: true,
      render: (text) => <span title={text}><EnvironmentOutlined /> {text || '-'}</span>
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleShowDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => showEditDrawer(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title={<Space><div style={{ width: 4, height: 16, backgroundColor: '#52c41a', borderRadius: 2 }} /><span>客户资源档案</span></Space>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAddDrawer}>新增客户</Button>}
    >
      <div style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Input placeholder="搜索企业全称..." prefix={<SearchOutlined />} allowClear 
              onPressEnter={(e: any) => setParams({ ...params, name: e.target.value, page: 1 })} />
          </Col>
          <Col span={4}>
            <Select placeholder="行业筛选" style={{ width: '100%' }} allowClear 
              onChange={(val) => setParams({ ...params, industry: val, page: 1 })} options={INDUSTRY_OPTIONS} />
          </Col>
          <Col span={4}>
            <Select placeholder="等级筛选" style={{ width: '100%' }} allowClear 
              onChange={(val) => setParams({ ...params, level: val, page: 1 })} options={LEVEL_OPTIONS} />
          </Col>
          <Col span={4}>
            <Select placeholder="来源筛选" style={{ width: '100%' }} allowClear 
              onChange={(val) => setParams({ ...params, source: val || undefined, page: 1 })} options={sourceOptions} />
          </Col>
        </Row>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading} 
        scroll={{ x: 1400 }} 
        pagination={{ 
          current: params.page, 
          pageSize: params.pageSize, 
          total: total, 
          showTotal: (t) => `共找到 ${t} 家客户`, 
          onChange: (p, s) => setParams({ ...params, page: p, pageSize: s }) 
        }} 
      />

      <Drawer 
        title={<span><EyeOutlined /> 客户详细资料</span>} 
        width={720} 
        onClose={() => setDetailVisible(false)} 
        open={detailVisible}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          {currentRow && (
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="基础资料" key="1">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="企业全称" span={2} labelStyle={{ width: 120 }}>
                    <Text strong style={{ color: '#1890ff' }}>{currentRow.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="客户等级">
                    <Tag color={LEVEL_OPTIONS.find(o => o.value === currentRow.level)?.color}>
                      {LEVEL_OPTIONS.find(o => o.value === currentRow.level)?.label || '普通客户'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="所属行业">
                    {INDUSTRY_OPTIONS.find(o => o.value === currentRow.industry)?.label || '--'}
                  </Descriptions.Item>
                  <Descriptions.Item label="社会信用代码" span={2}>{currentRow.usciCode || '--'}</Descriptions.Item>
                  <Descriptions.Item label="联系人">{currentRow.contactPerson || '--'}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{currentRow.contactPhone || '--'}</Descriptions.Item>
                  <Descriptions.Item label="客户来源">{currentRow.source || '--'}</Descriptions.Item>
                  <Descriptions.Item label="人员规模">{currentRow.scaleCount} 人</Descriptions.Item>
                  <Descriptions.Item label="经营地址" span={2}>{currentRow.address || '--'}</Descriptions.Item>
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
                        <Card 
                          size="small" 
                          variant="outlined"
                          style={{ borderLeft: acc.isDefault ? '4px solid #52c41a' : '4px solid #d9d9d9' }}
                          title={
                            <Space>
                              {acc.type === 'corporate' ? <BankOutlined style={{ color: '#1890ff' }} /> : <UserOutlined style={{ color: '#fa8c16' }} />}
                              <span style={{ fontWeight: 'bold' }}>{acc.accountName}</span>
                              {acc.isDefault && <Tag color="green">默认</Tag>}
                            </Space>
                          }
                          // 💡 修改点 7：在卡片右上角增加“设为默认”和“删除”按钮
                          extra={
                            <Space split={<div style={{ width: 1, height: 12, backgroundColor: '#eee' }} />}>
                              {!acc.isDefault && (
                                <Typography.Link onClick={() => handleSetDefaultAccount(acc.id)}>设为默认</Typography.Link>
                              )}
                              <Typography.Link 
                                onClick={() => {
                                  navigator.clipboard.writeText(copyText);
                                  message.success('已复制');
                                }}
                              >
                                复制
                              </Typography.Link>
                              <Typography.Link type="danger" onClick={() => handleDeleteAccount(acc)}>删除</Typography.Link>
                            </Space>
                          }
                        >
                          {acc.type === 'corporate' ? (
                            <Descriptions size="small" column={1} colon={false}>
                              <Descriptions.Item label={<Text type="secondary">信用代码</Text>}>{acc.usciCode}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">开户银行</Text>}>{acc.bankName}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">银行账号</Text>}>{acc.bankAccount}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">银行行号</Text>}>{acc.bankCode}</Descriptions.Item>
                              <Descriptions.Item label={<Text type="secondary">地址电话</Text>}>{acc.addressPhone}</Descriptions.Item>
                            </Descriptions>
                          ) : (
                            <Descriptions size="small" column={1} colon={false}>
                              <Descriptions.Item label={<Text type="secondary">持卡姓名</Text>}>{acc.accountName}</Descriptions.Item>
                              {acc.bankAccount && (
                                <>
                                  <Descriptions.Item label={<Text type="secondary">银行名称</Text>}>{acc.bankName}</Descriptions.Item>
                                  <Descriptions.Item label={<Text type="secondary">银行卡号</Text>}>{acc.bankAccount}</Descriptions.Item>
                                </>
                              )}
                              {acc.alipayAccount && (
                                <Descriptions.Item label={<Space><WalletOutlined style={{ color: '#1296db' }} />支付宝</Space>}>
                                  {acc.alipayAccount}
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          )}
                        </Card>
                      </List.Item>
                    );
                  }}
                  locale={{ emptyText: <Empty description="暂无关联账户信息" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
                <Button type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                  新增账户
                </Button>
              </Tabs.TabPane>
            </Tabs>
          )}
        </Spin>
      </Drawer>

      {/* 新增/编辑客户抽屉 */}
      <Drawer
        title={isEdit ? <span><EditOutlined /> 修改客户档案</span> : <span><PlusOutlined /> 新增客户档案</span>}
        width={560}
        onClose={() => setAddVisible(false)}
        open={addVisible}
        destroyOnClose
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setAddVisible(false)}>取消</Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>保存数据</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinishSave} initialValues={{ level: 'common', scaleCount: 0 }}>
          <Form.Item name="name" label="企业全称" rules={[{ required: true, message: '请输入企业全称' }]}><Input placeholder="请输入完整的企业工商登记名称" /></Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label="客户等级" rules={[{ required: true }]}><Select options={LEVEL_OPTIONS} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="所属行业" rules={[{ required: true }]}><Select options={INDUSTRY_OPTIONS} showSearch optionFilterProp="label" /></Form.Item>
            </Col>
          </Row>

          <Form.Item name="usciCode" label="统一社会信用代码"><Input placeholder="18位社会信用代码" maxLength={18} /></Form.Item>
          
          <Row gutter={16}>
            <Col span={12}><Form.Item name="contactPerson" label="联系人"><Input prefix={<UserOutlined />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="contactPhone" label="联系电话"><Input prefix={<PhoneOutlined />} /></Form.Item></Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source" label="客户来源" rules={[{ required: true }]}><Select options={sourceOptions} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scaleCount" label="人员规模"><InputNumber style={{ width: '100%' }} min={0} addonAfter="人" /></Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="详细地址"><Input.TextArea rows={3} placeholder="请输入企业的详细通讯地址或经营地址" /></Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};

export default CustomerList;