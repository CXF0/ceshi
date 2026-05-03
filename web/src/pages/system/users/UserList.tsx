/**
 * @file web/src/pages/system/users/UserList.tsx
 * @version 3.1.0 [2026-04-29]
 * @desc 新增业绩目标字段：是否设定目标 + 月度目标金额
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Card, Button, Tag, Space, Modal, Form, Input,
  Select, Switch, message, Popconfirm, Avatar, Row, Col,
  Tooltip, Divider, Badge, InputNumber,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  KeyOutlined, SearchOutlined, ReloadOutlined, PhoneOutlined,
  LockOutlined, CheckCircleOutlined, StopOutlined, TrophyOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import { useDeptOptions } from '@/hooks/useDeptOptions';
import dayjs from 'dayjs';

const ROLE_COLOR: Record<string, string> = {
  admin: 'red', manager: 'volcano', sales: 'orange', consultant: 'blue', reviewer: 'cyan',
};

const UserList: React.FC = () => {
  const [loading, setLoading]           = useState(false);
  const [data, setData]                 = useState<any[]>([]);
  const [roles, setRoles]               = useState<any[]>([]);
  const [modalOpen, setModalOpen]       = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [pwdTargetId, setPwdTargetId]   = useState<number | null>(null);
  const [pwdTargetName, setPwdTargetName] = useState('');
  const [searchName, setSearchName]     = useState('');
  const [searchDept, setSearchDept]     = useState<string | undefined>();
  const [searchStatus, setSearchStatus] = useState<number | undefined>();

  const { deptOptions, deptMap } = useDeptOptions();

  const [form]    = Form.useForm();
  const [pwdForm] = Form.useForm();

  // 监听"是否设定目标"控制金额是否显示
  const hasSalesTarget = Form.useWatch('hasSalesTarget', form);

  const loadRoles = useCallback(async () => {
    try {
      const res = await request.get('/role/list');
      setRoles((res as any)?.data?.data || (res as any)?.data || []);
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get('/users/list');
      let list: any[] = (res as any)?.data?.data || (res as any)?.data || [];
      if (searchName)   list = list.filter(u => u.nickname?.includes(searchName) || u.username?.includes(searchName));
      if (searchDept !== undefined) list = list.filter(u => String(u.deptId) === String(searchDept));
      if (searchStatus !== undefined) list = list.filter(u => u.status === searchStatus);
      setData(list);
    } catch { message.error('获取用户列表失败'); }
    finally { setLoading(false); }
  }, [searchName, searchDept, searchStatus]);

  useEffect(() => { loadRoles(); }, [loadRoles]);
  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusToggle = async (record: any) => {
    try {
      await request.post('/users/update', { id: record.id, status: record.status === 1 ? 0 : 1 });
      message.success(record.status === 1 ? '已禁用' : '已启用');
      loadData();
    } catch { message.error('操作失败'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/users/${id}`);
      message.success('删除成功');
      loadData();
    } catch { message.error('删除失败'); }
  };

  const openEdit = (record?: any) => {
    form.resetFields();
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        ...record,
        hasSalesTarget: record.hasSalesTarget === 1,
        roleIds: record.roles?.map((r: any) => r.id) || [],
      });
    } else {
      setEditingId(null);
      form.setFieldsValue({ hasSalesTarget: false });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        hasSalesTarget: values.hasSalesTarget ? 1 : 0,
        salesTarget:    values.hasSalesTarget ? values.salesTarget : null,
      };
      if (editingId) {
        await request.post('/users/update', { id: editingId, ...payload });
        message.success('更新成功');
      } else {
        await request.post('/users/create', payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

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
      message.success(`已重置「${pwdTargetName}」的密码`);
      setPwdModalOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('重置失败');
    }
  };

  const columns = [
    {
      title: '用户',
      key: 'user', width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Avatar size={36} style={{ backgroundColor: '#71ccbc', flexShrink: 0 }} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600, lineHeight: 1.4 }}>{record.nickname || '—'}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '手机号', dataIndex: 'phone', key: 'phone', width: 130,
      render: (v: string) => v
        ? <span><PhoneOutlined style={{ marginRight: 4 }} />{v}</span>
        : <span style={{ color: '#d9d9d9' }}>未填写</span>,
    },
    {
      title: '所属分公司', dataIndex: 'deptId', key: 'deptId', width: 140,
      render: (id: string) => deptMap[id] || `部门${id}`,
    },
    {
      title: '拥有角色', key: 'roles', width: 200,
      render: (_: any, record: any) => {
        const list: any[] = record.roles || [];
        if (!list.length) return <Tag color="default">暂无角色</Tag>;
        return <Space wrap size={4}>{list.map((r: any) => <Tag key={r.id} color={ROLE_COLOR[r.roleKey] || 'geekblue'}>{r.roleName}</Tag>)}</Space>;
      },
    },
    {
      title: '业绩目标', key: 'target', width: 130,
      render: (_: any, record: any) => {
        if (!record.hasSalesTarget) return <span style={{ color: '#d9d9d9' }}>未设定</span>;
        return (
          <Space size={4}>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span style={{ fontWeight: 600, color: '#fa8c16' }}>
              ¥{Number(record.salesTarget || 0).toLocaleString()}/月
            </span>
          </Space>
        );
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: number, record: any) => (
        <Tooltip title={status === 1 ? '点击禁用' : '点击启用'}>
          <Tag icon={status === 1 ? <CheckCircleOutlined /> : <StopOutlined />}
            color={status === 1 ? 'success' : 'default'}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleStatusToggle(record)}>
            {status === 1 ? '正常' : '已禁用'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—',
    },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Tooltip title="重置密码">
            <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => openResetPwd(record)}>密码</Button>
          </Tooltip>
          <Popconfirm title="确定删除该用户吗？" onConfirm={() => handleDelete(record.id)} okType="danger">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col flex="200px">
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索昵称/账号"
              allowClear value={searchName} onChange={e => setSearchName(e.target.value)} />
          </Col>
          <Col flex="160px">
            <Select placeholder="全部分公司" allowClear style={{ width: '100%' }}
              value={searchDept} onChange={v => setSearchDept(v)} options={deptOptions} />
          </Col>
          <Col flex="130px">
            <Select placeholder="全部状态" allowClear style={{ width: '100%' }}
              value={searchStatus} onChange={v => setSearchStatus(v)}
              options={[{ label: '正常', value: 1 }, { label: '已禁用', value: 0 }]} />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setSearchName(''); setSearchDept(undefined); setSearchStatus(undefined); }}>重置</Button>
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新增用户</Button>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }}
        title={<Space><UserOutlined style={{ color: '#71ccbc' }} /><span>用户列表</span><Badge count={data.length} style={{ backgroundColor: '#71ccbc' }} /></Space>}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 位用户` }} />
      </Card>

      {/* 新增/编辑 Modal */}
      <Modal title={<Space><UserOutlined />{editingId ? '编辑用户' : '新增用户'}</Space>}
        open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}
        width={580} destroyOnClose okText="确认保存">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="登录账号" rules={[{ required: true }]}>
                <Input disabled={!!editingId} placeholder="字母+数字" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nickname" label="用户昵称" rules={[{ required: true }]}>
                <Input placeholder="显示名称" />
              </Form.Item>
            </Col>
          </Row>
          {!editingId && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="password" label="初始密码" rules={[{ required: true }, { min: 6 }]}>
                  <Input.Password />
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
              <Form.Item name="deptId" label="所属分公司" rules={[{ required: true }]}>
                <Select placeholder="请选择" options={deptOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="用户状态" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="正常" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="roleIds" label="分配角色" rules={[{ required: true, message: '至少分配一个角色' }]}>
            <Select mode="multiple" placeholder="请选择角色">
              {roles.map((r: any) => (
                <Select.Option key={r.id} value={r.id}>
                  <Tag color={ROLE_COLOR[r.roleKey] || 'geekblue'} style={{ margin: 0 }}>{r.roleKey}</Tag> {r.roleName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 业绩目标 */}
          <Divider style={{ margin: '8px 0 16px' }}>业绩目标（可选）</Divider>
          <Row gutter={16} align="middle">
            <Col span={10}>
              <Form.Item name="hasSalesTarget" label="是否设定月度目标" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            {hasSalesTarget && (
              <Col span={14}>
                <Form.Item name="salesTarget" label="月度目标金额"
                  rules={[{ required: true, message: '请填写目标金额' }]}>
                  <InputNumber style={{ width: '100%' }} prefix="¥" precision={2} min={0}
                    placeholder="请输入月度签约目标金额" />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>

      {/* 重置密码 Modal */}
      <Modal title={<Space><LockOutlined style={{ color: '#faad14' }} />重置密码 — {pwdTargetName}</Space>}
        open={pwdModalOpen} onOk={handleResetPwd} onCancel={() => setPwdModalOpen(false)}
        width={400} destroyOnClose okText="确认重置" okButtonProps={{ danger: true }}>
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="newPassword" label="新密码"
            rules={[{ required: true }, { min: 6, message: '至少 6 位' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认密码" dependencies={['newPassword']}
            rules={[{ required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次密码不一致'));
                },
              })]}>
            <Input.Password placeholder="再次确认密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;