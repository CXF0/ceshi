import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message, 
  Popconfirm,
  TreeSelect
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios'; // 建议封装自己的 request 工具

const UserList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [roles, setRoles] = useState([]); // 角色列表
  const [orgTree, setOrgTree] = useState([]); // 部门树

  // 模拟部门数据（对应你后端的 depts 数组）
  const deptOptions = [
    { id: 1, name: '寻梦控股昆明分公司' },
    { id: 2, name: '寻梦认证成都分公司' },
    { id: 3, name: '寻梦控股总公司' },
    { id: 4, name: '寻梦认证杭州分公司' },
    { id: 5, name: '寻梦控股宣城总公司' },
  ];

  // 1. 初始化数据加载
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users/list'); // 对应你的 UsersController.findAll
      if (res.data.code === 200) setData(res.data.data);
      
      // 加载角色列表供下拉框使用
      const roleRes = await axios.get('/api/roles/list'); 
      setRoles(roleRes.data.data);

      // 加载组织树
      const treeRes = await axios.get('/api/users/org-tree');
      setOrgTree(treeRes.data.data);
    } catch (err) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. 状态切换处理
  const handleStatusChange = async (checked: boolean, record: any) => {
    try {
      await axios.post('/api/users/update', { id: record.id, status: checked ? 1 : 0 });
      message.success('状态更新成功');
      loadData();
    } catch (err) {
      message.error('更新失败');
    }
  };

  // 3. 删除处理
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/users/${id}`);
      message.success('删除成功');
      loadData();
    } catch (err) {
      message.error('删除失败');
    }
  };

  // 4. 提交表单（新增或编辑）
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const url = editingId ? '/api/users/update' : '/api/users/create';
      const payload = editingId ? { ...values, id: editingId } : values;

      const res = await axios.post(url, payload);
      if (res.data.code === 200) {
        message.success(editingId ? '更新成功' : '创建成功');
        setIsModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error('Validate Failed:', err);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (text: string) => <b>{text}</b>,
    },
    {
      title: '登录账号',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '所属部门',
      dataIndex: 'deptId',
      key: 'deptId',
      render: (id: number) => deptOptions.find(d => d.id === id)?.name || '未知部门',
    },
    {
      title: '拥有角色',
      dataIndex: 'roleNames',
      key: 'roleNames',
      render: (names: string) => (
        <>
          {names.split(', ').map(name => (
            <Tag color="blue" key={name} style={{ borderRadius: 4 }}>
              {name}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number, record: any) => (
        <Switch 
          checked={status === 1} 
          onChange={(checked) => handleStatusChange(checked, record)} 
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingId(record.id);
              // 注意：这里需要把实体的 roles 对象数组转为 roleIds 给 Select 组件
              const roleIds = record.roles?.map((r: any) => r.id);
              form.setFieldsValue({ ...record, roleIds });
              setIsModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该用户吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="用户管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            新增用户
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 新增/编辑对话框 */}
      <Modal
        title={editingId ? "编辑用户" : "新增用户"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1 }}>
          <Form.Item name="username" label="登录账号" rules={[{ required: true }]}>
            <Input disabled={!!editingId} placeholder="请输入账号" />
          </Form.Item>
          
          {!editingId && (
            <Form.Item name="password" label="初始密码" rules={[{ required: true }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item name="nickname" label="用户昵称" rules={[{ required: true }]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item name="deptId" label="所属部门" rules={[{ required: true }]}>
            <Select placeholder="请选择分公司">
              {deptOptions.map(dept => (
                <Select.Option key={dept.id} value={dept.id}>{dept.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="roleIds" label="分配角色" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择角色">
              {roles.map((role: any) => (
                <Select.Option key={role.id} value={role.id}>{role.roleName}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="用户状态" valuePropName="checked">
            <Switch checkedChildren="正常" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;