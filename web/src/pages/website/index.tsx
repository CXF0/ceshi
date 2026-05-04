/**
 * @file src/pages/website/index.tsx
 * @version 1.2.0 [2026-05-04]
 * @desc 官网管理 — 修复：
 *   1. Tab空白：request拦截器返回完整response，数据在 res.data.data 层级
 *   2. 表单空：setFieldsValue 需传 res.data.data（后端的 config object）
 *   3. Table dataIndex 改为驼峰（对齐 TypeORM Entity 返回）
 *   4. ServicesTab/CasesTab 加 ?all=1 参数，后台查全量
 *   5. 所有 Tab 加空状态提示、加载状态
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Tabs, Form, Input, Button, Table, Modal, message,
  Switch, InputNumber, Select, Space, Popconfirm, Tag,
  Row, Col, Divider, Spin, Empty,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  EyeOutlined, SaveOutlined, ArrowUpOutlined, ArrowDownOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { TextArea } = Input;

/* ══════════════════════════════════════════════════
   Tab 1：基础配置
   修复：res.data.data 才是 config object
══════════════════════════════════════════════════ */
function SiteConfigTab() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/site/config');
      // request 拦截器 return response（完整axios响应）
      // 后端返回: { code: 200, data: { hero_title: '...', ... } }
      // axios 包了一层: res.data = { code, data }  →  res.data.data = 实际配置
      const configData = res?.data?.data ?? res?.data ?? {};
      form.setFieldsValue(configData);
    } catch {
      message.error('加载配置失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await request.post('/site/config', values);
      message.success('配置已保存');
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="加载配置中..." />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 900 }}>

      <Divider orientation={"left" as any} orientationMargin={0} style={{ fontWeight: 700, fontSize: 14 }}>
        🏠 Hero 区域文案
      </Divider>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="hero_title_black" label="主标题 — 黑色部分" rules={[{ required: true, message: '请填写' }]} extra="如：让企业认证">
            <Input placeholder="让企业认证" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="hero_title_blue" label="主标题 — 蓝色部分（换行）" rules={[{ required: true, message: '请填写' }]} extra="如：更简单、更透明">
            <Input placeholder="更简单、更透明" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="hero_subtitle" label="副标题描述">
            <TextArea rows={3} placeholder="正达通是专业的企业认证服务平台..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="hero_badge_text" label="顶部标签文字">
            <Input placeholder="深耕认证行业 · 数字化赋能" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="hero_primary_btn" label="主按钮文字">
            <Input placeholder="免费咨询" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="hero_secondary_btn" label="次按钮文字">
            <Input placeholder="了解更多" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation={"left" as any} orientationMargin={0} style={{ fontWeight: 700, fontSize: 14 }}>
        📊 Hero 统计数字（4组）
      </Divider>
      <Row gutter={16}>
        {([
          { placeholderVal: '2000', placeholderUnit: '+',  placeholderLabel: '服务企业数' },
          { placeholderVal: '98',   placeholderUnit: '%',  placeholderLabel: '认证通过率' },
          { placeholderVal: '10',   placeholderUnit: '年', placeholderLabel: '行业经验'   },
          { placeholderVal: '50',   placeholderUnit: '+',  placeholderLabel: '专业顾问'   },
        ] as const).map((p, idx) => {
          const n = idx + 1;
          return (
            <React.Fragment key={n}>
              <Col span={5}>
                <Form.Item name={`stat_${n}_value`} label={`数值 ${n}`}>
                  <Input placeholder={p.placeholderVal} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name={`stat_${n}_unit`} label="单位">
                  <Input placeholder={p.placeholderUnit} />
                </Form.Item>
              </Col>
              <Col span={15}>
                <Form.Item name={`stat_${n}_label`} label="说明文字">
                  <Input placeholder={p.placeholderLabel} />
                </Form.Item>
              </Col>
            </React.Fragment>
          );
        })}
      </Row>

      <Divider orientation={"left" as any} orientationMargin={0} style={{ fontWeight: 700, fontSize: 14 }}>
        🏢 公司基础信息
      </Divider>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="company_name" label="公司名称">
            <Input placeholder="正达通认证服务有限公司" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="founded_year" label="成立年份">
            <Input placeholder="2015" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="company_desc" label="公司简介">
            <TextArea rows={3} placeholder="深耕认证行业十余年..." />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="company_mission" label="公司使命">
            <TextArea rows={2} placeholder="通过「人工+智能」的服务模式，将复杂的认证流程标准化、透明化..." />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="company_vision" label="公司愿景">
            <TextArea rows={2} placeholder="成为中国领先的企业合规服务平台..." />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="025-66090399" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="zhengdatong@163.com" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="address" label="公司地址">
            <Input placeholder="南京市建邺区江东中路 315 号..." />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation={"left" as any} orientationMargin={0} style={{ fontWeight: 700, fontSize: 14 }}>
        🔍 SEO 配置
      </Divider>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item name="seo_title" label="网页标题（Title）">
            <Input placeholder="正达通 — 专业企业认证服务平台" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="seo_description" label="Meta Description">
            <TextArea rows={2} placeholder="专业 ISO 认证、CMMI、ITSS、高新技术企业认定服务..." />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="seo_keywords" label="Keywords（逗号分隔）">
            <Input placeholder="ISO认证,CMMI,ITSS,高新技术企业,认证服务" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation={"left" as any} orientationMargin={0} style={{ fontWeight: 700, fontSize: 14 }}>
        📄 子页面文案
      </Divider>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="services_page_title" label="认证服务页 — 主标题">
            <Input placeholder="全方位认证服务" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="services_page_subtitle" label="认证服务页 — 副标题">
            <Input placeholder="从体系认证到资质申报，覆盖企业全生命周期需求" />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 32, paddingBottom: 32 }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} size="large">
          保存所有配置
        </Button>
        <Button style={{ marginLeft: 12 }} onClick={load} icon={<ReloadOutlined />}>重新读取</Button>
      </div>
    </Form>
  );
}

/* ══════════════════════════════════════════════════
   Tab 2：认证服务卡片管理
   修复：?all=1 全量；dataIndex 用驼峰；Switch 正确回填
══════════════════════════════════════════════════ */
function ServicesTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/site/services', { params: { all: '1' } });
      const list = res?.data?.data ?? res?.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch {
      message.error('加载认证服务失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ theme: 'light', iconType: 'shield', isActive: true, sortOrder: (data.length || 0) + 1 });
    setModalOpen(true);
  };

  const openEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      features: Array.isArray(record.features) ? record.features.join('\n') : (record.features || ''),
      tags: Array.isArray(record.tags) ? record.tags.join(',') : (record.tags || ''),
      isActive: record.isActive === 1 || record.isActive === true,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/site/services/${id}`);
      message.success('已删除');
      load();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        features: typeof values.features === 'string'
          ? values.features.split('\n').map((s: string) => s.trim()).filter(Boolean)
          : (values.features || []),
        tags: typeof values.tags === 'string'
          ? values.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (values.tags || []),
        isActive: values.isActive ? 1 : 0,
      };
      if (editing?.id) {
        await request.put(`/site/services/${editing.id}`, payload);
      } else {
        await request.post('/site/services', payload);
      }
      message.success('保存成功');
      setModalOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: '排序', dataIndex: 'sortOrder', width: 70, sorter: (a: any, b: any) => a.sortOrder - b.sortOrder },
    { title: '标题', dataIndex: 'title', width: 160 },
    { title: '副标题', dataIndex: 'subtitle', ellipsis: true },
    {
      title: '主题', dataIndex: 'theme', width: 80,
      render: (v: string) => (
        <Tag color={v === 'dark' ? '#111827' : v === 'blue' ? '#2563eb' : 'default'}>
          {v === 'dark' ? '深色' : v === 'blue' ? '蓝色' : '白色'}
        </Tag>
      ),
    },
    {
      title: '状态', dataIndex: 'isActive', width: 80,
      render: (v: number) => <Tag color={v ? 'green' : 'red'}>{v ? '显示' : '隐藏'}</Tag>,
    },
    {
      title: '操作', width: 100, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除该服务卡片？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增服务卡片</Button>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </div>
      <Table
        rowKey="id" columns={columns} dataSource={data} loading={loading} size="middle"
        locale={{ emptyText: <Empty description="暂无服务卡片，点击「新增」添加" /> }}
        pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
      />
      <Modal
        title={editing ? '编辑服务卡片' : '新增服务卡片'}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSave} confirmLoading={saving} width={660} okText="保存" destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}>
                <Input placeholder="ISO 体系认证" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="subtitle" label="副标题（小标签）">
                <Input placeholder="国际管理体系标准" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="服务描述" rules={[{ required: true, message: '请填写描述' }]}>
                <TextArea rows={3} placeholder="涵盖 ISO9001、ISO14001..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="features" label="特性列表（每行一条）" extra="每行一条，如：专家全程指导">
                <TextArea rows={4} placeholder={'专家全程驻场指导\n通过率行业领先\n一对一文件辅导\n认证后持续支持'} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="tags" label="标签（逗号分隔）" extra="如：高通过率,专家指导">
                <Input placeholder="高通过率,专家指导" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="iconType" label="图标类型">
                <Select options={[
                  { value: 'shield', label: '🛡 盾牌' },
                  { value: 'code',   label: '💻 代码' },
                  { value: 'star',   label: '⭐ 星形' },
                  { value: 'award',  label: '🏆 奖杯' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="theme" label="卡片主题">
                <Select options={[
                  { value: 'light', label: '⬜ 白色' },
                  { value: 'dark',  label: '⬛ 深色' },
                  { value: 'blue',  label: '🟦 蓝色' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="是否显示" valuePropName="checked">
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

/* ══════════════════════════════════════════════════
   Tab 3：客户案例管理
   修复：?all=1；dataIndex 驼峰；Switch 正确回填
══════════════════════════════════════════════════ */
function CasesTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/site/cases', { params: { all: '1' } });
      const list = res?.data?.data ?? res?.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch {
      message.error('加载案例失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, isFeatured: false, sortOrder: (data.length || 0) + 1, logoColor: '#3b82f6' });
    setModalOpen(true);
  };

  const openEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      tags: Array.isArray(record.tags) ? record.tags.join(',') : (record.tags || ''),
      isActive: record.isActive === 1 || record.isActive === true,
      isFeatured: record.isFeatured === 1 || record.isFeatured === true,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/site/cases/${id}`);
      message.success('已删除');
      load();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        tags: typeof values.tags === 'string'
          ? values.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (values.tags || []),
        isActive: values.isActive ? 1 : 0,
        isFeatured: values.isFeatured ? 1 : 0,
      };
      if (editing?.id) {
        await request.put(`/site/cases/${editing.id}`, payload);
      } else {
        await request.post('/site/cases', payload);
      }
      message.success('保存成功');
      setModalOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: '排序', dataIndex: 'sortOrder', width: 60, sorter: (a: any, b: any) => a.sortOrder - b.sortOrder },
    { title: '企业名称', dataIndex: 'companyName', width: 180, ellipsis: true },
    { title: '行业', dataIndex: 'industry', width: 100 },
    { title: '认证类型', dataIndex: 'certType', ellipsis: true },
    { title: '服务周期', dataIndex: 'duration', width: 90 },
    {
      title: '精选', dataIndex: 'isFeatured', width: 70,
      render: (v: number) => <Tag color={v ? 'gold' : 'default'}>{v ? '精选' : '普通'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'isActive', width: 70,
      render: (v: number) => <Tag color={v ? 'green' : 'red'}>{v ? '显示' : '隐藏'}</Tag>,
    },
    {
      title: '操作', width: 100, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除该案例？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增案例</Button>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </div>
      <Table
        rowKey="id" columns={columns} dataSource={data} loading={loading} size="middle" scroll={{ x: 900 }}
        locale={{ emptyText: <Empty description="暂无客户案例，点击「新增」添加" /> }}
        pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
      />
      <Modal
        title={editing ? '编辑案例' : '新增案例'}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSave} confirmLoading={saving} width={680} okText="保存" destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="companyName" label="企业名称" rules={[{ required: true, message: '请填写企业名称' }]}>
                <Input placeholder="南京某科技有限公司" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="行业">
                <Input placeholder="软件IT / 制造业 / 医疗健康" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certType" label="认证类型" rules={[{ required: true, message: '请填写认证类型' }]}>
                <Input placeholder="ISO 27001 + CMMI 3" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="案例背景" rules={[{ required: true, message: '请填写案例背景' }]}>
                <TextArea rows={3} placeholder="该公司在参与政府采购招投标时..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="result" label="服务成果" rules={[{ required: true, message: '请填写服务成果' }]}>
                <TextArea rows={2} placeholder="历时 4 个月完成认证，成功中标..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="服务周期">
                <Input placeholder="4 个月" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签（逗号分隔）">
                <Input placeholder="信息安全,CMMI,政府采购" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="logoText" label="Logo 简称（2字内）">
                <Input placeholder="智" maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="logoColor" label="Logo 颜色（HEX）">
                <Input placeholder="#3b82f6" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="isFeatured" label="精选" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="isActive" label="显示" valuePropName="checked">
                <Switch checkedChildren="显" unCheckedChildren="隐" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

/* ══════════════════════════════════════════════════
   Tab 4：荣誉资质管理
   修复：数据层级 res.data.data.honor_list；加空状态
══════════════════════════════════════════════════ */
function HonorsTab() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/site/config');
      const configData = res?.data?.data ?? res?.data ?? {};
      const honorList = configData?.honor_list;
      setData(Array.isArray(honorList) ? honorList : []);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await request.post('/site/config', { honor_list: data });
      message.success('保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const val = newItem.trim();
    if (!val) return;
    if (data.includes(val)) { message.warning('该项已存在'); return; }
    setData(prev => [...prev, val]);
    setNewItem('');
  };

  const removeItem = (index: number) => setData(prev => prev.filter((_, i) => i !== index));

  const moveUp = (index: number) => {
    if (index === 0) return;
    setData(prev => { const arr = [...prev]; [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]; return arr; });
  };

  const moveDown = (index: number) => {
    setData(prev => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev]; [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]; return arr;
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin tip="加载中..." /></div>;
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        管理「关于我们」页面展示的资质证书和荣誉称号，可上下调整排序。
      </p>

      {data.length === 0 && (
        <Empty description="暂无荣誉资质，请在下方添加" style={{ marginBottom: 24 }} />
      )}

      <div style={{ marginBottom: 24 }}>
        {data.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: 'white',
              borderRadius: 10, border: '1px solid #f3f4f6', marginBottom: 8,
            }}
          >
            <span style={{
              width: 24, height: 24, background: '#eff6ff', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#2563eb', fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, fontSize: 14, color: '#374151' }}>{item}</span>
            <Button size="small" icon={<ArrowUpOutlined />} onClick={() => moveUp(i)} disabled={i === 0} />
            <Button size="small" icon={<ArrowDownOutlined />} onClick={() => moveDown(i)} disabled={i === data.length - 1} />
            <Popconfirm title="确认删除？" onConfirm={() => removeItem(i)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onPressEnter={addItem}
          placeholder="如：国家高新技术企业认定"
          style={{ flex: 1 }}
          allowClear
        />
        <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>添加</Button>
      </div>

      <Space>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          保存荣誉列表
        </Button>
        <Button onClick={load} icon={<ReloadOutlined />}>重新读取</Button>
      </Space>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   主组件
══════════════════════════════════════════════════ */
export default function WebsiteManagement() {
  const tabItems = [
    { key: 'config',   label: '🌐 基础配置',  children: <SiteConfigTab /> },
    { key: 'services', label: '🏷 认证服务',  children: <ServicesTab />   },
    { key: 'cases',    label: '📁 客户案例',  children: <CasesTab />      },
    { key: 'honors',   label: '🏆 荣誉资质',  children: <HonorsTab />     },
  ];

  return (
    <Card
      title={
        <Space>
          <GlobalOutlined style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 700 }}>官网管理</span>
          <Button type="link" size="small" href="/" target="_blank" icon={<EyeOutlined />}>
            预览官网
          </Button>
        </Space>
      }
    >
      <Tabs items={tabItems} size="large" />
    </Card>
  );
}