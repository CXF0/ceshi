import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Card, Button, Space, Tag, Modal, Form, 
  Input, InputNumber, Switch, message, Popconfirm, Divider,
  Col, Row, Select
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SettingOutlined, ApartmentOutlined, SearchOutlined, ReloadOutlined
} from '@ant-design/icons';
import request from '@/utils/request';

const { Option } = Select;

const CertificationList: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm(); // 💡 新增查询表单
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 1. 获取数据
const fetchList = async (searchValues: any = {}) => {
  setLoading(true);
  try {
    // 1. 预处理参数：剔除 undefined 和空字符串，保留数字 0
    const cleanParams: any = {};
    Object.keys(searchValues).forEach(key => {
      const val = searchValues[key];
      if (val !== undefined && val !== '' && val !== null) {
        cleanParams[key] = val;
      }
    });

    console.log('--- 准备发送的清洗后参数 ---', cleanParams);

    // 2. 关键！使用配置对象传参
    // 注意这里是 { params: cleanParams }
    const res: any = await request.get('/cert-types', { 
      params: cleanParams 
    });

    // 3. 这里的打印非常重要，如果还不带问号，那就是 request 实例的问题
    console.log('--- 浏览器最终请求的 URL ---', res?.config?.url);

    // 4. 解析数据（兼容 NestJS 返回的多种格式）
    const list = res?.data?.data || res?.data || res || [];
    setData(Array.isArray(list) ? list : []);

  } catch (e) {
    console.error('Fetch error:', e);
    message.error('加载数据失败');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchList();
  }, []);

  // 2. 查询逻辑
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    fetchList(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    fetchList();
  };

  // 3. 自动生成大类下拉列表（基于已有数据去重）
  const parentOptions = useMemo(() => {
    const names = data.map(item => item.parent_name).filter(Boolean);
    return Array.from(new Set(names));
  }, [data]);

  // 4. 其他 CRUD 操作 (handleAdd, handleEdit, handleDelete, onFinish 保持不变)
  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ sort: 0, is_active: true });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({ ...record, is_active: record.is_active === 1 });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/cert-types/${id}`);
      message.success('删除成功');
      fetchList(searchForm.getFieldsValue());
    } catch (e) {
      message.error('删除失败');
    }
  };

  const onFinish = async (values: any) => {
    const postData = { ...values, is_active: values.is_active ? 1 : 0 };
    try {
      if (editingId) {
        await request.put(`/cert-types/${editingId}`, postData);
        message.success('更新成功');
      } else {
        await request.post('/cert-types', postData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchList(searchForm.getFieldsValue());
    } catch (e: any) {
      const serverMsg = e.response?.data?.message;
      message.error(Array.isArray(serverMsg) ? serverMsg[0] : (serverMsg || '保存失败'));
    }
  };

  // 5. 表格列配置
  const columns = [
    {
      title: '所属大类',
      dataIndex: 'parent_name',
      render: (text: string, record: any) => (
        <span><Tag color="cyan">{record.parent_code}</Tag>{text}</span>
      ),
    },
    {
      title: '认证项名称',
      dataIndex: 'type_name',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 'bold' }}>{text}</span>
          <code style={{ fontSize: '11px', color: '#999' }}>{record.type_code}</code>
        </Space>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      sorter: (a: any, b: any) => a.sort - b.sort,
      width: 80,
    },
    {
      title: '年审预警提前天数',
      dataIndex: 'remind_days',
      width: 180,
    },
    {
      title: '材料起草时限',
      dataIndex: 'material_days',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (val: number) => (
        <Tag color={val === 1 ? 'success' : 'error'}>{val === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      {/* 🔍 查询筛选栏 */}
      <Card size="small">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="parent_name" label="所属大类" style={{ width: 220 }}>
            <Select placeholder="全部大类" allowClear showSearch>
              {parentOptions.map(name => (
                <Option key={name} value={name}>{name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="is_active" label="状态" style={{ width: 150 }}>
            <Select placeholder="全部状态" allowClear>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit" onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 📊 数据表格栏 */}
      <Card 
        title={<span><ApartmentOutlined style={{ marginRight: 8 }} />认证类型字典管理</span>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增认证项</Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* 弹窗部分保持原来的 Modal 代码即可... */}
      <Modal
        title={editingId ? '编辑认证类型' : '新增认证类型'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
        destroyOnClose={true}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
           {/* ... 这里是你之前的 Form 内部代码 ... */}
           <Row gutter={16}>
             <Col span={12}><Form.Item name="parent_code" label="大类代码" rules={[{ required: true }]}><Input /></Form.Item></Col>
             <Col span={12}><Form.Item name="parent_name" label="大类名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
           </Row>
           <Row gutter={16}>
             <Col span={12}><Form.Item name="type_code" label="项目代码" rules={[{ required: true }]}><Input disabled={!!editingId} /></Form.Item></Col>
             <Col span={12}><Form.Item name="type_name" label="项目名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
           </Row>
           <Form.Item name="description" label="项目描述"><Input.TextArea rows={2} /></Form.Item>
           <Row gutter={16}>
             <Col span={12}><Form.Item name="sort" label="排序权重"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
             <Col span={12}><Form.Item name="is_active" label="状态" valuePropName="checked"><Switch /></Form.Item></Col>
           </Row>
        </Form>
      </Modal>
    </Space>
  );
};

export default CertificationList;