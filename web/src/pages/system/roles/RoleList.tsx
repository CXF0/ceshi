/**
 * @file web/src/pages/system/roles/RoleList.tsx
 * @version 2.1.0 [2026-04-28]
 * @desc 保存权限时自动补充父级菜单 key，避免菜单被过滤掉
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Card, Button, Tag, Space, Modal, Form, Input,
  Switch, message, Popconfirm, Tooltip, Divider,
  Badge, Row, Col, Drawer, Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SafetyCertificateOutlined, SearchOutlined, ReloadOutlined,
  CheckCircleOutlined, StopOutlined, InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import dayjs from 'dayjs';

// ── 角色颜色映射 ──────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  admin:      'red',
  manager:    'volcano',
  sales:      'orange',
  consultant: 'blue',
  reviewer:   'cyan',
};

// ── 菜单+按钮权限树定义 ──────────────────────────────
const PERMISSION_TREE: DataNode[] = [
  {
    title: '业务看板', key: '/dashboard',
    children: [
      { title: '查看看板', key: '/dashboard:view' },
    ],
  },
  {
    title: '客户管理', key: 'crm_group',
    children: [
      { title: '客户列表', key: '/crm',
        children: [
          { title: '新增客户', key: '/crm:add' },
          { title: '编辑客户', key: '/crm:edit' },
          { title: '查看详情', key: '/crm:view' },
        ],
      },
    ],
  },
  {
    title: '合同管理', key: 'contract_group',
    children: [
      { title: '合同列表', key: '/contract',
        children: [
          { title: '起草合同', key: '/contract:add' },
          { title: '编辑合同', key: '/contract:edit' },
          { title: '删除合同', key: '/contract:delete' },
          { title: '查看详情', key: '/contract:view' },
          { title: '上传附件', key: '/contract:upload' },
        ],
      },
    ],
  },
  {
    title: '证书管理', key: '/certificates',
    children: [
      { title: '新增证书', key: '/certificates:add' },
      { title: '编辑证书', key: '/certificates:edit' },
      { title: '删除证书', key: '/certificates:delete' },
    ],
  },
  {
    title: '机构管理', key: '/institutions',
    children: [
      { title: '新增机构', key: '/institutions:add' },
      { title: '编辑机构', key: '/institutions:edit' },
      { title: '删除机构', key: '/institutions:delete' },
    ],
  },
  {
    title: '系统设置', key: 'system',
    children: [
      { title: '认证类型', key: '/system/certification',
        children: [
          { title: '新增认证类型', key: '/system/certification:add' },
          { title: '编辑认证类型', key: '/system/certification:edit' },
          { title: '删除认证类型', key: '/system/certification:delete' },
        ],
      },
      { title: '通知管理', key: '/system/notification',
        children: [
          { title: '发布公告', key: '/system/notification:add' },
          { title: '撤回公告', key: '/system/notification:revoke' },
          { title: '删除公告', key: '/system/notification:delete' },
        ],
      },
      { title: '用户管理', key: '/system/users',
        children: [
          { title: '新增用户', key: '/system/users:add' },
          { title: '编辑用户', key: '/system/users:edit' },
          { title: '删除用户', key: '/system/users:delete' },
          { title: '重置密码', key: '/system/users:resetpwd' },
        ],
      },
      { title: '角色管理', key: '/system/roles',
        children: [
          { title: '新增角色', key: '/system/roles:add' },
          { title: '编辑角色', key: '/system/roles:edit' },
          { title: '删除角色', key: '/system/roles:delete' },
          { title: '配置权限', key: '/system/roles:permission' },
        ],
      },
    ],
  },
];

// ── 工具：获取所有节点 key（含父级，用于全选）────────
const getAllKeys = (nodes: DataNode[]): string[] => {
  const keys: string[] = [];
  const walk = (list: DataNode[]) => {
    list.forEach(n => {
      keys.push(n.key as string);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
};
const ALL_KEYS = getAllKeys(PERMISSION_TREE);

// ── 工具：保存时自动补充父级 key ──────────────────────
// 例：勾选了 /crm:add，自动把 /crm、crm_group 也加进去
// 这样 Sidebar 才能正确显示菜单入口
function expandWithAncestors(checkedKeys: string[], tree: DataNode[]): string[] {
  // 建立 子key → 父key 映射
  const parentMap = new Map<string, string>();
  const buildMap = (nodes: DataNode[], parentKey?: string) => {
    nodes.forEach(n => {
      const key = n.key as string;
      if (parentKey) parentMap.set(key, parentKey);
      if (n.children) buildMap(n.children, key);
    });
  };
  buildMap(tree);

  const result = new Set<string>(checkedKeys);
  checkedKeys.forEach(key => {
    let cur = key;
    while (parentMap.has(cur)) {
      const parent = parentMap.get(cur)!;
      result.add(parent);
      cur = parent;
    }
  });

  return Array.from(result);
}

// ── 工具：打开抽屉时过滤掉纯父级 key，只保留叶子和有意义的节点
// 让 Tree 的 checkedKeys 只显示用户真正勾选的，父级由 Tree 自动半选
function filterLeafKeys(permissions: string[], tree: DataNode[]): string[] {
  // 收集所有父级 key（有 children 的节点）
  const parentKeys = new Set<string>();
  const walk = (nodes: DataNode[]) => {
    nodes.forEach(n => {
      if (n.children && n.children.length > 0) {
        parentKeys.add(n.key as string);
        walk(n.children);
      }
    });
  };
  walk(tree);

  // 只返回非父级的 key（即叶子节点权限）
  return permissions.filter(k => !parentKeys.has(k));
}

// ── 主组件 ─────────────────────────────────────────────
const RoleList: React.FC = () => {
  const [loading, setLoading]         = useState(false);
  const [data, setData]               = useState<any[]>([]);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [searchName, setSearchName]   = useState('');

  const [permDrawerOpen, setPermDrawerOpen] = useState(false);
  const [permTarget, setPermTarget]         = useState<any>(null);
  const [checkedKeys, setCheckedKeys]       = useState<string[]>([]);
  const [permSaving, setPermSaving]         = useState(false);

  const [form] = Form.useForm();

  // ── 加载角色列表 ─────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get('/role/list');
      let list: any[] = (res as any)?.data?.data || (res as any)?.data || [];
      if (searchName) {
        list = list.filter(r =>
          r.roleName?.includes(searchName) || r.roleKey?.includes(searchName)
        );
      }
      setData(list);
    } catch {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchName]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── 状态切换 ─────────────────────────────────────────
  const handleStatusToggle = async (record: any) => {
    if (record.roleKey === 'admin') return;
    try {
      await request.put(`/role/${record.id}`, { ...record, status: record.status === 1 ? 0 : 1 });
      message.success(record.status === 1 ? '已禁用' : '已启用');
      loadData();
    } catch { message.error('操作失败'); }
  };

  // ── 删除 ─────────────────────────────────────────────
  const handleDelete = async (record: any) => {
    if (record.roleKey === 'admin') { message.warning('超级管理员角色不可删除'); return; }
    try {
      await request.delete(`/role/${record.id}`);
      message.success('删除成功');
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败，该角色可能已有关联用户');
    }
  };

  // ── 打开编辑弹窗 ─────────────────────────────────────
  const openEdit = (record?: any) => {
    form.resetFields();
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({ ...record, status: record.status === 1 });
    } else {
      setEditingId(null);
      form.setFieldsValue({ status: true });
    }
    setModalOpen(true);
  };

  // ── 提交编辑/新增 ─────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, status: values.status ? 1 : 0 };
      if (editingId) {
        await request.put(`/role/${editingId}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/role', payload);
        message.success('角色创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  // ── 打开权限配置抽屉 ──────────────────────────────────
  const openPermDrawer = (record: any) => {
    setPermTarget(record);
    let saved: string[] = [];
    try {
      const raw = Array.isArray(record.permissions)
        ? record.permissions
        : JSON.parse(record.permissions || '[]');
      // 打开时只勾选叶子节点，父级由 Tree 自动处理半选状态
      saved = filterLeafKeys(raw, PERMISSION_TREE);
    } catch { saved = []; }
    setCheckedKeys(saved);
    setPermDrawerOpen(true);
  };

  // ── 保存权限配置 ──────────────────────────────────────
  const handleSavePerm = async () => {
    if (!permTarget) return;
    setPermSaving(true);
    try {
      // ✅ 关键：保存时自动补充父级菜单 key
      const fullPermissions = expandWithAncestors(checkedKeys, PERMISSION_TREE);

      await request.put(`/role/${permTarget.id}`, {
        ...permTarget,
        permissions: fullPermissions,
      });
      message.success(`「${permTarget.roleName}」权限配置已保存`);
      setPermDrawerOpen(false);
      loadData();
    } catch {
      message.error('保存失败');
    } finally {
      setPermSaving(false);
    }
  };

  // ── 全选 / 全不选（只操作叶子节点，父级自动跟随）────
  const leafKeys = ALL_KEYS.filter(k => {
    const parentKeys = new Set<string>();
    const walk = (nodes: DataNode[]) => {
      nodes.forEach(n => {
        if (n.children?.length) { parentKeys.add(n.key as string); walk(n.children); }
      });
    };
    walk(PERMISSION_TREE);
    return !parentKeys.has(k);
  });

  const handleCheckAll = () => {
    setCheckedKeys(checkedKeys.length === leafKeys.length ? [] : leafKeys);
  };

  // ── 表格列定义 ────────────────────────────────────────
  const columns = [
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 130,
      render: (name: string, record: any) => (
        <Space>
          <SafetyCertificateOutlined
            style={{ color: ROLE_COLOR[record.roleKey] ? `#${
              { red:'f5222d', volcano:'fa541c', orange:'fa8c16', blue:'1677ff', cyan:'13c2c2' }[ROLE_COLOR[record.roleKey]] || '71ccbc'
            }` : '#71ccbc' }}
          />
          <span style={{ fontWeight: 600 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: '角色标识',
      dataIndex: 'roleKey',
      key: 'roleKey',
      width: 120,
      render: (key: string) => (
        <Tag color={ROLE_COLOR[key] || 'geekblue'} style={{ fontFamily: 'monospace' }}>
          {key}
        </Tag>
      ),
    },
    {
      title: '权限描述',
      key: 'desc',
      minWidth: 160,
      render: (_: any, record: any) => {
        const desc = record.description || '—';
        return (
          <span style={{ color: '#595959', fontSize: 13 }}>
            {desc.length > 28 ? <Tooltip title={desc}>{desc.slice(0, 28)}…</Tooltip> : desc}
          </span>
        );
      },
    },
    {
      title: '已配权限',
      key: 'permissions',
      width: 90,
      render: (_: any, record: any) => {
        let count = 0;
        try {
          const p = Array.isArray(record.permissions)
            ? record.permissions
            : JSON.parse(record.permissions || '[]');
          // 只统计叶子节点数量（实际操作权限数）
          const parentKeys = new Set<string>();
          const walk = (nodes: DataNode[]) => {
            nodes.forEach(n => {
              if (n.children?.length) { parentKeys.add(n.key as string); walk(n.children); }
            });
          };
          walk(PERMISSION_TREE);
          count = p.filter((k: string) => !parentKeys.has(k)).length;
        } catch { count = 0; }
        return (
          <Badge
            count={count}
            showZero
            style={{ backgroundColor: count > 0 ? '#71ccbc' : '#d9d9d9' }}
          />
        );
      },
    },
    {
      title: '关联用户',
      key: 'userCount',
      width: 90,
      render: (_: any, record: any) => {
        const count = record.users?.length ?? record.userCount ?? 0;
        return (
          <Badge
            count={count}
            showZero
            style={{ backgroundColor: count > 0 ? '#1677ff' : '#d9d9d9' }}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 88,
      render: (status: number, record: any) => (
        <Tooltip title={record.roleKey === 'admin' ? '超管不可禁用' : (status === 1 ? '点击禁用' : '点击启用')}>
          <Tag
            icon={status === 1 ? <CheckCircleOutlined /> : <StopOutlined />}
            color={status === 1 ? 'success' : 'default'}
            style={{
              cursor: record.roleKey === 'admin' ? 'not-allowed' : 'pointer',
              userSelect: 'none',
            }}
            onClick={() => record.roleKey !== 'admin' && handleStatusToggle(record)}
          >
            {status === 1 ? '启用' : '禁用'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 108,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 168,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={0} split={<Divider type="vertical" style={{ margin: '0 2px' }} />}>
          <Button
            type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >编辑</Button>
          <Button
            type="link" size="small" icon={<SettingOutlined />}
            style={{ color: '#722ed1' }}
            onClick={() => openPermDrawer(record)}
          >权限</Button>
          <Popconfirm
            title="确定删除该角色吗？"
            description="有关联用户时删除会失败"
            onConfirm={() => handleDelete(record)}
            okType="danger"
            disabled={record.roleKey === 'admin'}
          >
            <Button
              type="link" size="small" danger
              disabled={record.roleKey === 'admin'}
              icon={<DeleteOutlined />}
            >删除</Button>
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
          <Col flex="220px">
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="搜索角色名称 / 标识"
              allowClear
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onPressEnter={loadData}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => setSearchName('')}>重置</Button>
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
              新增角色
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
            <SafetyCertificateOutlined style={{ color: '#71ccbc' }} />
            <span>角色权限管理</span>
            <Badge count={data.length} style={{ backgroundColor: '#71ccbc' }} />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个角色` }}
        />
      </Card>

      {/* ── 新增/编辑 Modal ── */}
      <Modal
        title={<Space><SafetyCertificateOutlined />{editingId ? '编辑角色' : '新增角色'}</Space>}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={480}
        destroyOnClose
        okText="确认保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="roleName" label="角色名称" rules={[{ required: true }]}>
                <Input placeholder="如：咨询顾问" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roleKey"
                label={
                  <Space size={4}>
                    角色标识
                    <Tooltip title="英文小写，创建后不可修改。如：consultant">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </Tooltip>
                  </Space>
                }
                rules={[
                  { required: true, message: '请输入角色标识' },
                  { pattern: /^[a-z_]+$/, message: '仅允许小写字母和下划线' },
                ]}
              >
                <Input placeholder="如：consultant" disabled={!!editingId} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="角色描述">
            <Input.TextArea rows={2} placeholder="简要说明该角色的职责范围" />
          </Form.Item>
          <Form.Item name="status" label="角色状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 权限配置抽屉 ── */}
      <Drawer
        title={
          <Space>
            <SettingOutlined style={{ color: '#722ed1' }} />
            配置权限
            {permTarget && (
              <Tag color={ROLE_COLOR[permTarget.roleKey] || 'geekblue'}>
                {permTarget.roleName}
              </Tag>
            )}
          </Space>
        }
        width={420}
        open={permDrawerOpen}
        onClose={() => setPermDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPermDrawerOpen(false)}>取消</Button>
              <Button onClick={handleCheckAll}>
                {checkedKeys.length === leafKeys.length ? '全不选' : '全选'}
              </Button>
              <Button type="primary" loading={permSaving} onClick={handleSavePerm}>
                保存权限
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 12 }}>
          已选 <span style={{ color: '#722ed1', fontWeight: 600 }}>{checkedKeys.length}</span> / {leafKeys.length} 项权限
        </div>
        <Tree
          checkable
          defaultExpandAll
          checkedKeys={checkedKeys}
          onCheck={(checked) => setCheckedKeys(checked as string[])}
          treeData={PERMISSION_TREE}
          style={{ fontSize: 13 }}
        />
      </Drawer>
    </div>
  );
};

export default RoleList;