/**
 * @file web/src/pages/system/users/UserList.tsx
 * @version 3.0.0 [2026-04-28]
 * @desc 用户管理 - 完整重写：对齐后端真实接口，换用项目封装 request，补全搜索/重置密码/手机号
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Card, Button, Tag, Space, Modal, Form, Input,
  Select, Switch, message, Popconfirm, Avatar, Row, Col,
  Tooltip, Divider, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  KeyOutlined, SearchOutlined, ReloadOutlined, PhoneOutlined,
  LockOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import dayjs from 'dayjs';

// ── 常量 ───────────────────────────────────────────────
const DEPT_OPTIONS = [
  { id: 1, name: '昆明分公司' },
  { id: 2, name: '成都分公司' },
  { id: 3, name: '总公司' },
  { id: 4, name: '杭州分公司' },
  { id: 5, name: '宣城总公司' },
];

// 角色标识 → 颜色映射
const ROLE_COLOR: Record<string, string> = {
  admin:      'red',
  manager:    'volcano',
  sales:      'orange',
  consultant: 'blue',
  reviewer:   'cyan',
};

// ── 主组件 ─────────────────────────────────────────────
const UserList: React.FC = () => {
  const [loading, setLoading]         = useState(false);
  const [data, setData]               = useState<any[]>([]);
  const [roles, setRoles]             = useState<any[]>([]);
  const [modalOpen, setModalOpen]     = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [pwdTargetId, setPwdTargetId] = useState<number | null>(null);
  const [pwdTargetName, setPwdTargetName] = useState('');
  const [searchName, setSearchName]   = useState('');
  const [searchDept, setSearchDept]   = useState<number | undefined>();
  const [searchStatus, setSearchStatus] = useState<number | undefined>();

  const [form]    = Form.useForm();
  const [pwdForm] = Form.useForm();

  // ── 拉取角色列表 ─────────────────────────────────────
  const loadRoles = useCallback(async () => {
    try {
      const res = await request.get('/role/list');
      const list = (res as any)?.data?.data || (res as any)?.data || [];
      setRoles(Array.isArray(list) ? list : []);
    } catch {
      // 角色加载失败不阻断用户列表渲染
    }
  }, []);

  // ── 拉取用户列表（带本地筛选）────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get('/users/list');
      const raw: any[] = (res as any)?.data?.data || (res as any)?.data || [];

      // 前端筛选（后端 findAll 不支持 query 参数时的降级方案）
      let filtered = raw;
      if (searchName)   filtered = filtered.filter(u => u.nickname?.includes(searchName) || u.username?.includes(searchName));
      if (searchDept !== undefined)   filtered = filtered.filter(u => u.deptId === searchDept);
      if (searchStatus !== undefined) filtered = filtered.filter(u => u.status === searchStatus);

      setData(filtered);
    } catch {
      message.error('获取用户列表失败，请检查网络');
    } finally {
      setLoading(false);
    }
  }, [searchName, searchDept, searchStatus]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── 状态切换 ─────────────────────────────────────────
  const handleStatusToggle = async (record: any) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await request.post('/users/update', { id: record.id, status: newStatus });
      message.success(newStatus === 1 ? '已启用用户' : '已禁用用户');
      loadData();
    } catch {
      message.error('状态更新失败');
    }
  };

  // ── 删除用户 ─────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/users/${id}`);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  // ── 打开新增/编辑弹窗 ────────────────────────────────
  const openEdit = (record?: any) => {
    form.resetFields();
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        ...record,
        roleIds: record.roles?.map((r: any) => r.id) || [],
      });
    } else {
      setEditingId(null);
    }
    setModalOpen(true);
  };

  // ── 提交新增/编辑 ────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await request.post('/users/update', { id: editingId, ...values });
        message.success('更新成功');
      } else {
        await request.post('/users/create', values);
        message.success('用户创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      if (err?.errorFields) return; // 表单校验失败，不弹toast
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  // ── 重置密码 ─────────────────────────────────────────
  const openResetPwd = (record: any) => {
    pwdForm.resetFields();
    setPwdTargetId(record.id);
    setPwdTargetName(record.nickname || record.username);
    setPwdModalOpen(true);
  };

  const handleResetPwd = async () => {
    try {
      const { newPassword } = await pwdForm.validateFields();
      await request.post('/users/update', { id: pwdTargetId, password: newPassword });
      message.success(`已成功重置「${pwdTargetName}」的密码`);
      setPwdModalOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('重置密码失败');
    }
  };

  // ── 表格列 ───────────────────────────────────────────
  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Avatar
            size={36}
            style={{ backgroundColor: '#71ccbc', flexShrink: 0 }}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 600, lineHeight: 1.4 }}>{record.nickname || '—'}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (v: string) => v
        ? <span><PhoneOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />{v}</span>
        : <span style={{ color: '#d9d9d9' }}>未填写</span>,
    },
    {
      title: '所属分公司',
      dataIndex: 'deptId',
      key: 'deptId',
      width: 140,
      render: (id: number) => DEPT_OPTIONS.find(d => d.id === id)?.name || `部门${id}`,
    },
    {
      title: '拥有角色',
      key: 'roles',
      width: 200,
      render: (_: any, record: any) => {
        const roleList: any[] = record.roles || [];
        if (roleList.length === 0) return <Tag color="default">暂无角色</Tag>;
        return (
          <Space wrap size={4}>
            {roleList.map((r: any) => (
              <Tag key={r.id} color={ROLE_COLOR[r.roleKey] || 'geekblue'}>
                {r.roleName}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: number, record: any) => (
        <Tooltip title={status === 1 ? '点击禁用' : '点击启用'}>
          <Tag
            icon={status === 1 ? <CheckCircleOutlined /> : <StopOutlined />}
            color={status === 1 ? 'success' : 'default'}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleStatusToggle(record)}
          >
            {status === 1 ? '正常' : '已禁用'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Tooltip title="重置登录密码">
            <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => openResetPwd(record)}>
              密码
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定删除该用户吗？"
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okType="danger"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* ── 搜索栏 ── */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col flex="200px">
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="搜索昵称 / 账号"
              allowClear
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </Col>
          <Col flex="160px">
            <Select
              placeholder="全部分公司"
              allowClear
              style={{ width: '100%' }}
              value={searchDept}
              onChange={v => setSearchDept(v)}
              options={DEPT_OPTIONS.map(d => ({ label: d.name, value: d.id }))}
            />
          </Col>
          <Col flex="130px">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: '100%' }}
              value={searchStatus}
              onChange={v => setSearchStatus(v)}
              options={[{ label: '正常', value: 1 }, { label: '已禁用', value: 0 }]}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSearchName(''); setSearchDept(undefined); setSearchStatus(undefined);
              }}>重置</Button>
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
              新增用户
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ── 表格 ── */}
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={
          <Space>
            <UserOutlined style={{ color: '#71ccbc' }} />
            <span>用户列表</span>
            <Badge count={data.length} style={{ backgroundColor: '#71ccbc' }} />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 位用户`,
          }}
        />
      </Card>

      {/* ── 新增/编辑 Modal ── */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            {editingId ? '编辑用户' : '新增用户'}
          </Space>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        destroyOnClose
        okText="确认保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入账号' }]}>
                <Input disabled={!!editingId} placeholder="字母+数字，不可修改" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nickname" label="用户昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                <Input placeholder="显示名称" />
              </Form.Item>
            </Col>
          </Row>

          {!editingId && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请设置密码' }, { min: 6, message: '至少6位' }]}>
                  <Input.Password placeholder="至少 6 位" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="phone" label="手机号">
                  <Input prefix={<PhoneOutlined />} placeholder="选填" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {editingId && (
            <Form.Item name="phone" label="手机号">
              <Input prefix={<PhoneOutlined />} placeholder="选填" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deptId" label="所属分公司" rules={[{ required: true, message: '请选择分公司' }]}>
                <Select placeholder="请选择" options={DEPT_OPTIONS.map(d => ({ label: d.name, value: d.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="用户状态" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="正常" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="roleIds" label="分配角色" rules={[{ required: true, message: '至少分配一个角色' }]}>
            <Select
              mode="multiple"
              placeholder="请选择角色（可多选）"
              optionLabelProp="label"
            >
              {roles.map((r: any) => (
                <Select.Option key={r.id} value={r.id} label={r.roleName}>
                  <Space>
                    <Tag color={ROLE_COLOR[r.roleKey] || 'geekblue'} style={{ margin: 0 }}>
                      {r.roleKey}
                    </Tag>
                    {r.roleName}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 重置密码 Modal ── */}
      <Modal
        title={
          <Space>
            <LockOutlined style={{ color: '#faad14' }} />
            重置密码 — {pwdTargetName}
          </Space>
        }
        open={pwdModalOpen}
        onOk={handleResetPwd}
        onCancel={() => setPwdModalOpen(false)}
        width={400}
        destroyOnClose
        okText="确认重置"
        okButtonProps={{ danger: true }}
      >
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少 6 位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次密码输入不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次确认新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;