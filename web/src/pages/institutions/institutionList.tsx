import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Tag, Modal, Form, Input, InputNumber, Switch, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getInstitutions, saveInstitution, deleteInstitution } from '@/services/institution';

const { Option } = Select;

const InstitutionList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm(); // 查询表单实例
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // 加载数据 (支持查询参数)
  const loadData = async () => {
    setLoading(true);
    try {
      const queryValues = await queryForm.getFieldsValue();
      const res = await getInstitutions(queryValues);
      if (res.code === 200) setData(res.data);
    } catch (err) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 重置查询
  const handleReset = () => {
    queryForm.resetFields();
    loadData();
  };

  // 打开弹窗
  const handleEdit = (record?: any) => {
    setEditingRecord(record || null);
    form.setFieldsValue(record ? {
      ...record,
      is_active: record.is_active === 1
    } : { 
      is_active: true, 
      tax_point: 6.0 
    });
    setIsModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 构造提交载荷
      const payload = {
        ...values,
        id: editingRecord?.id, // 编辑时带上数字主键
        is_active: values.is_active ? 1 : 0 // 转换 Switch 状态
      };

      const res = await saveInstitution(payload);
      if (res.code === 200) {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setIsModalVisible(false);
        loadData();
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.error('机构代码已存在，请修改后重试');
      } else {
        console.error(error);
      }
    }
  };

  const columns = [
    { 
      title: '机构代码', 
      dataIndex: 'institution_code', 
      width: 120, 
      render: (code: string) => <Tag color="blue">{code}</Tag> 
    },
    { title: '机构名称', dataIndex: 'name', ellipsis: true, width: 250 },
    { 
      title: '开票信息', 
      dataIndex: 'bank_name', 
      width: 250,
      render: (_: any, record: any) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div><BankOutlined /> {record.bank_name || '-'}</div>
          <div>卡号: {record.bank_account || '-'}</div>
          <div>税号: {record.tax_no || '-'}</div>
        </div>
      )
    },
    { title: '税点', dataIndex: 'tax_point', render: (val: number) => `${val}%`, width: 80 },
    { 
      title: '状态', 
      width: 100,
      dataIndex: 'is_active', 
      render: (val: number) => (
        <Tag color={val === 1 ? 'green' : 'red'}>{val === 1 ? '启用' : '禁用'}</Tag>
      ) 
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: '确认删除该机构吗？',
              content: `机构代码: ${record.institution_code}`,
              onOk: async () => {
                await deleteInstitution(record.id);
                message.success('删除成功');
                loadData();
              }
            });
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* 查询区域与操作按钮 */}
      <Card title="机构管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleEdit()}>新增机构</Button>}>
        
        {/* 查询表单 */}
        <Form form={queryForm} layout="inline" style={{ marginBottom: 20 }}>
          <Form.Item name="name" label="机构名称">
            <Input placeholder="请输入机构名称" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="is_active" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      
        {/* 💡 修正点：这里只保留一个 Table */}
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading} 
          size="middle" 
        />

        <Modal
          title={editingRecord ? "编辑机构信息" : "新增机构"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          width={600}
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              name="institution_code" 
              label="机构代码 (简写)" 
              rules={[{ required: true, message: '请输入机构简写代码' }]}
            >
              <Input placeholder="如: CQC" disabled={!!editingRecord} />
            </Form.Item>

            <Form.Item 
              name="name" 
              label="机构全称 (开票抬头)" 
              rules={[{ required: true, message: '请输入机构全称' }]}
            >
              <Input placeholder="请输入完整的企业名称" />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="tax_no" label="纳税人识别号" style={{ flex: 1 }}>
                <Input placeholder="税号" />
              </Form.Item>
              <Form.Item name="tax_point" label="税点 (%)" style={{ width: '120px' }}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </div>

            <Form.Item name="bank_name" label="开户行">
              <Input placeholder="XX银行XX支行" />
            </Form.Item>

            <Form.Item name="bank_account" label="银行账号">
              <Input placeholder="请输入银行卡号" />
            </Form.Item>

            <Form.Item name="address_phone" label="开票地址及电话">
              <Input.TextArea rows={2} placeholder="用于开具专票的地址和电话" />
            </Form.Item>

            <Form.Item name="is_active" label="启用状态" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </Space>
  );
};

export default InstitutionList;