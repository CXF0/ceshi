/**
 * @file web/src/pages/system/dept/DeptList.tsx
 * @version 1.1.0 [2026-04-29]
 * @desc 接入 PermButton 权限控制
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Card, Button, Tag, Space, Modal, Form, Input,
  TreeSelect, Switch, message, Popconfirm, Tooltip,
  Divider, Badge, Row, Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ApartmentOutlined, SearchOutlined, ReloadOutlined,
  CheckCircleOutlined, StopOutlined, PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';
import PermButton from '@/components/PermButton';
import dayjs from 'dayjs';

const TH = (label: string) => <span style={{ whiteSpace: 'nowrap' }}>{label}</span>;

interface DeptNode {
  id: string;
  deptName: string;
  parentId: string | null;
  children?: DeptNode[];
}

function buildTree(list: DeptNode[]): DeptNode[] {
  const map: Record<string, DeptNode> = {};
  list.forEach(d => { map[d.id] = { ...d, children: [] }; });
  const roots: DeptNode[] = [];
  list.forEach(d => {
    if (d.parentId && map[d.parentId]) {
      map[d.parentId].children!.push(map[d.id]);
    } else {
      roots.push(map[d.id]);
    }
  });
  return roots;
}

function collectDescendants(list: DeptNode[], rootId: string): Set<string> {
  const result = new Set<string>([rootId]);
  const walk = (id: string) => {
    list.filter(d => d.parentId === id).forEach(d => { result.add(d.id); walk(d.id); });
  };
  walk(rootId);
  return result;
}

function toTreeSelectData(nodes: DeptNode[], excludeIds?: Set<string>): any[] {
  return nodes.map(node => ({
    title: node.deptName,
    value: node.id,
    disabled: excludeIds?.has(node.id),
    children: node.children?.length ? toTreeSelectData(node.children, excludeIds) : undefined,
  }));
}

const DeptList: React.FC = () => {
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');
  const [treeData, setTreeData]   = useState<any[]>([]);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/depts');
      const list: any[] = res?.data?.data || res?.data || [];
      const filtered = searchName ? list.filter(d => d.deptName?.includes(searchName)) : list;
      setData(filtered);
      const tree = buildTree(list);
      setTreeData(toTreeSelectData(tree));
    } catch { message.error('获取公司列表失败'); }
    finally { setLoading(false); }
  }, [searchName]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleStatus = async (record: any) => {
    try {
      await request.put(`/depts/${record.id}`, { ...record, status: record.status === 1 ? 0 : 1 });
      message.success(record.status === 1 ? '已停用' : '已启用');
      loadData();
    } catch { message.error('操作失败'); }
  };

  const handleDelete = async (record: any) => {
    const hasChildren = data.some(d => d.parentId === record.id);
    if (hasChildren) { message.warning('该公司下还有子公司，请先删除或迁移子公司'); return; }
    try {
      await request.delete(`/depts/${record.id}`);
      message.success('删除成功');
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败，该公司可能有关联用户或客户');
    }
  };

  const openEdit = (record?: any) => {
    form.resetFields();
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({ ...record, status: record.status === 1, parentId: record.parentId || undefined });
      const excludeIds = collectDescendants(data, record.id);
      const tree = buildTree(data);
      setTreeData(toTreeSelectData(tree, excludeIds));
    } else {
      setEditingId(null);
      const tree = buildTree(data);
      setTreeData(toTreeSelectData(tree));
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    let values: any;
    try { values = await form.validateFields(); } catch { return; }
    const payload = { ...values, status: values.status ? 1 : 0, parentId: values.parentId || null };
    try {
      if (editingId) {
        await request.put(`/depts/${editingId}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/depts', { ...payload, id: String(Date.now()) });
        message.success('公司创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) { message.error(err?.response?.data?.message || '操作失败'); }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    return data.find(d => d.id === parentId)?.deptName || parentId;
  };

  const columns: ColumnsType<any> = [
    {
      title: TH('公司名称'), dataIndex: 'deptName', width: 200,
      render: (name: string, record: any) => (
        <Space>
          <ApartmentOutlined style={{ color: record.parentId ? '#71ccbc' : '#1677ff' }} />
          <span style={{ fontWeight: record.parentId ? 400 : 600 }}>{name}</span>
          {!record.parentId && <Tag color="blue" style={{ fontSize: 10 }}>顶级</Tag>}
        </Space>
      ),
    },
    {
      title: TH('上级公司'), dataIndex: 'parentId', width: 160,
      render: (parentId: string) => {
        const name = getParentName(parentId);
        return name
          ? <span style={{ color: '#595959' }}>{name}</span>
          : <span style={{ color: '#bbb' }}>— 顶级公司</span>;
      },
    },
    {
      title: TH('负责人'), dataIndex: 'leader', width: 110,
      render: (v: string) => v
        ? <Space size={4}><UserOutlined style={{ color: '#8c8c8c' }} />{v}</Space>
        : <span style={{ color: '#d9d9d9' }}>未设置</span>,
    },
    {
      title: TH('联系电话'), dataIndex: 'phone', width: 130,
      render: (v: string) => v
        ? <Space size={4}><PhoneOutlined style={{ color: '#8c8c8c' }} />{v}</Space>
        : <span style={{ color: '#d9d9d9' }}>—</span>,
    },
    {
      title: TH('子公司数'), key: 'childCount', width: 90, align: 'center' as const,
      render: (_: any, record: any) => {
        const count = data.filter(d => d.parentId === record.id).length;
        return <Badge count={count} showZero style={{ backgroundColor: count > 0 ? '#1677ff' : '#d9d9d9' }} />;
      },
    },
    {
      title: TH('状态'), dataIndex: 'status', width: 90,
      render: (status: number, record: any) => (
        <Tooltip title={status === 1 ? '点击停用' : '点击启用'}>
          <Tag icon={status === 1 ? <CheckCircleOutlined /> : <StopOutlined />}
            color={status === 1 ? 'success' : 'default'}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleToggleStatus(record)}>
            {status === 1 ? '正常' : '停用'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: TH('创建时间'), dataIndex: 'createdAt', width: 110,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—',
    },
    {
      title: TH('操作'), key: 'action', fixed: 'right' as const, width: 130,
      render: (_: any, record: any) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <PermButton perm="/system/depts:edit" type="link" size="small"
            icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</PermButton>
          <Popconfirm title="确定删除该公司？" description="有子公司或关联用户时删除会失败"
            onConfirm={() => handleDelete(record)} okType="danger">
            <PermButton perm="/system/depts:delete" type="link" size="small" danger
              icon={<DeleteOutlined />}>删除</PermButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col flex="220px">
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索公司名称"
              allowClear value={searchName} onChange={e => setSearchName(e.target.value)} onPressEnter={loadData} />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => setSearchName('')}>重置</Button>
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <PermButton perm="/system/depts:add" type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
              新增公司
            </PermButton>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }}
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#71ccbc' }} />
            <span>公司管理</span>
            <Badge count={data.length} style={{ backgroundColor: '#71ccbc' }} />
          </Space>
        }>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
          scroll={{ x: 900 }} pagination={{ pageSize: 20, showTotal: t => `共 ${t} 家公司` }} />
      </Card>

      <Modal
        title={<Space><ApartmentOutlined />{editingId ? '编辑公司信息' : '新增公司'}</Space>}
        open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}
        width={520} destroyOnClose okText="确认保存">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="deptName" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="请输入完整公司名称" />
          </Form.Item>
          <Form.Item name="parentId"
            label={<Space size={4}>上级公司<span style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 400 }}>（不选则为顶级公司）</span></Space>}>
            <TreeSelect treeData={treeData} placeholder="不选 = 顶级公司，无上级" allowClear
              treeDefaultExpandAll style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
              showSearch treeNodeFilterProp="title" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leader" label="负责人">
                <Input prefix={<UserOutlined />} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话">
                <Input prefix={<PhoneOutlined />} placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="正常" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeptList;