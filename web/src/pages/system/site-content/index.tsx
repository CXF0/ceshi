import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Spin,
  Switch,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, EyeOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { SiteContentApi } from '@/services/site-content';

const iconOptions = [
  { label: '盾牌', value: 'shield' },
  { label: '代码', value: 'code' },
  { label: '地球', value: 'globe' },
];

const themeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
];

export default function SiteContentSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const initialValues = useMemo(() => ({
    brand: { logoText: '', footerBrandText: '' },
    header: { phone: '', loginText: '', consultText: '', nav: [] },
    hero: {
      badge: '',
      titleLines: [],
      highlight: '',
      description: '',
      servedText: '',
      heroImageUrl: '',
      metric: { value: '', labelLines: [] },
      avatars: [],
    },
    services: { title: '', subtitle: '', tags: [], cards: [] },
    digital: { title: '', description: '', steps: [], imageUrl: '' },
    cases: { title: '', subtitle: '', items: [] },
    footer: {
      description: '',
      cols: [],
      contact: { title: '', phone: '', address: '', email: '' },
      copyright: '',
      legalLinks: [],
    },
  }), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await SiteContentApi.getAdmin();
        const data = (res as any)?.data?.data ?? (res as any)?.data ?? initialValues;
        form.setFieldsValue({ ...initialValues, ...data });
      } catch {
        message.error('获取官网内容配置失败');
        form.setFieldsValue(initialValues);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [form, initialValues, refreshKey]);

  const onSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await SiteContentApi.update(values);
      message.success('保存成功');
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title="官网内容管理"
        extra={
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => window.open('#/', '_blank')}>预览官网</Button>
            <Button icon={<ReloadOutlined />} onClick={() => setRefreshKey(k => k + 1)}>刷新</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={initialValues}>
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="品牌信息" style={{ borderRadius: 12 }}>
                <Form.Item name={['brand', 'logoText']} label="顶部品牌文本">
                  <Input placeholder="如：ZhengDaTong" />
                </Form.Item>
                <Form.Item name={['brand', 'footerBrandText']} label="页脚品牌文本">
                  <Input placeholder="如：ZHENGYOUKE" />
                </Form.Item>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="顶部栏" style={{ borderRadius: 12 }}>
                <Form.Item name={['header', 'phone']} label="联系电话">
                  <Input placeholder="如：025-66090399" />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name={['header', 'loginText']} label="登录按钮文案">
                      <Input placeholder="如：管家登录" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['header', 'consultText']} label="咨询按钮文案">
                      <Input placeholder="如：立即咨询" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name={['header', 'nav']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="导航菜单"
                      extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add({ label: '', href: '' })}>新增</Button>}
                      style={{ borderRadius: 12 }}
                    >
                      {fields.map(field => (
                        <Row key={field.key} gutter={12} align="middle">
                          <Col span={9}>
                            <Form.Item name={[field.name, 'label']} rules={[{ required: true, message: '请输入名称' }]}>
                              <Input placeholder="名称" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name={[field.name, 'href']} rules={[{ required: true, message: '请输入锚点/链接' }]}>
                              <Input placeholder="如：#hero" />
                            </Form.Item>
                          </Col>
                          <Col span={3} style={{ textAlign: 'right' }}>
                            <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                          </Col>
                        </Row>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>暂无导航项</div>}
                    </Card>
                  )}
                </Form.List>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card size="small" title="首屏 Hero" style={{ borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={['hero', 'badge']} label="徽标文案">
                      <Input placeholder="如：深耕认证行业 · 数字化赋能" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['hero', 'highlight']} label="高亮文案">
                      <Input placeholder="如：更简单、更透明" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.List name={['hero', 'titleLines']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="标题行"
                      extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add('')}>新增</Button>}
                      style={{ borderRadius: 12, marginBottom: 12 }}
                    >
                      {fields.map(field => (
                        <Row key={field.key} gutter={12} align="middle">
                          <Col span={21}>
                            <Form.Item name={field.name} rules={[{ required: true, message: '请输入标题' }]}>
                              <Input placeholder="如：让企业认证" />
                            </Form.Item>
                          </Col>
                          <Col span={3} style={{ textAlign: 'right' }}>
                            <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                          </Col>
                        </Row>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>建议至少 2 行</div>}
                    </Card>
                  )}
                </Form.List>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={['hero', 'servedText']} label="服务数据文案">
                      <Input placeholder="如：累计服务 10,000+ 知名企业" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['hero', 'heroImageUrl']} label="首屏图片 URL">
                      <Input placeholder="https://..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name={['hero', 'description']} label="描述">
                  <Input.TextArea rows={3} placeholder="一句话/一段介绍" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name={['hero', 'metric', 'value']} label="指标数值">
                      <Input placeholder="如：75%" />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.List name={['hero', 'metric', 'labelLines']}>
                      {(fields, { add, remove }) => (
                        <Card
                          size="small"
                          title="指标说明行"
                          extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add('')}>新增</Button>}
                          style={{ borderRadius: 12 }}
                        >
                          {fields.map(field => (
                            <Row key={field.key} gutter={12} align="middle">
                              <Col span={21}>
                                <Form.Item name={field.name} rules={[{ required: true, message: '请输入说明' }]}>
                                  <Input placeholder="如：平均认证" />
                                </Form.Item>
                              </Col>
                              <Col span={3} style={{ textAlign: 'right' }}>
                                <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                              </Col>
                            </Row>
                          ))}
                          {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>可选</div>}
                        </Card>
                      )}
                    </Form.List>
                  </Col>
                </Row>

                <Form.List name={['hero', 'avatars']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="头像（URL）"
                      extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add('')}>新增</Button>}
                      style={{ borderRadius: 12, marginTop: 12 }}
                    >
                      {fields.map(field => (
                        <Row key={field.key} gutter={12} align="middle">
                          <Col span={21}>
                            <Form.Item name={field.name} rules={[{ required: true, message: '请输入 URL' }]}>
                              <Input placeholder="https://..." />
                            </Form.Item>
                          </Col>
                          <Col span={3} style={{ textAlign: 'right' }}>
                            <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                          </Col>
                        </Row>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>可选</div>}
                    </Card>
                  )}
                </Form.List>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card size="small" title="核心认证服务" style={{ borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={['services', 'title']} label="标题">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['services', 'subtitle']} label="副标题">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.List name={['services', 'tags']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="标签"
                      extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add('')}>新增</Button>}
                      style={{ borderRadius: 12, marginBottom: 12 }}
                    >
                      {fields.map(field => (
                        <Row key={field.key} gutter={12} align="middle">
                          <Col span={21}>
                            <Form.Item name={field.name} rules={[{ required: true, message: '请输入标签' }]}>
                              <Input placeholder="如：体系认证" />
                            </Form.Item>
                          </Col>
                          <Col span={3} style={{ textAlign: 'right' }}>
                            <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                          </Col>
                        </Row>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>可选</div>}
                    </Card>
                  )}
                </Form.List>

                <Form.List name={['services', 'cards']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="服务卡片"
                      extra={
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={() => add({ icon: 'shield', theme: 'light', title: '', description: '', tags: [] })}
                        >
                          新增
                        </Button>
                      }
                      style={{ borderRadius: 12 }}
                    >
                      {fields.map(field => (
                        <Card
                          key={field.key}
                          size="small"
                          title={`卡片 #${field.name + 1}`}
                          extra={<Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}
                          style={{ borderRadius: 12, marginBottom: 12 }}
                        >
                          <Row gutter={12}>
                            <Col span={6}>
                              <Form.Item name={[field.name, 'icon']} label="图标">
                                <Select options={iconOptions} />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item name={[field.name, 'theme']} label="主题">
                                <Select options={themeOptions} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name={[field.name, 'title']} label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                                <Input />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name={[field.name, 'description']} label="描述">
                            <Input.TextArea rows={2} />
                          </Form.Item>
                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item name={[field.name, 'linkText']} label="链接文案（可选）">
                                <Input />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name={[field.name, 'linkHref']} label="链接地址（可选）">
                                <Input />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item name={[field.name, 'extraText']} label="附加小字（可选）">
                            <Input />
                          </Form.Item>
                          <Form.List name={[field.name, 'tags']}>
                            {(tagFields, { add: addTag, remove: removeTag }) => (
                              <Card
                                size="small"
                                title="卡片标签"
                                extra={<Button type="link" icon={<PlusOutlined />} onClick={() => addTag('')}>新增</Button>}
                                style={{ borderRadius: 12 }}
                              >
                                {tagFields.map(tf => (
                                  <Row key={tf.key} gutter={12} align="middle">
                                    <Col span={21}>
                                      <Form.Item name={tf.name} rules={[{ required: true, message: '请输入标签' }]}>
                                        <Input placeholder="如：高通过率" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={3} style={{ textAlign: 'right' }}>
                                      <Button type="text" icon={<MinusCircleOutlined />} onClick={() => removeTag(tf.name)} />
                                    </Col>
                                  </Row>
                                ))}
                                {tagFields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>可选</div>}
                              </Card>
                            )}
                          </Form.List>
                        </Card>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>暂无服务卡片</div>}
                    </Card>
                  )}
                </Form.List>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card size="small" title="优证管家" style={{ borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={['digital', 'title']} label="标题（可换行）">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['digital', 'imageUrl']} label="图片 URL">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name={['digital', 'description']} label="描述">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.List name={['digital', 'steps']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="步骤"
                      extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add({ n: '', title: '', desc: '' })}>新增</Button>}
                      style={{ borderRadius: 12 }}
                    >
                      {fields.map(field => (
                        <Card
                          key={field.key}
                          size="small"
                          title={`步骤 #${field.name + 1}`}
                          extra={<Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}
                          style={{ borderRadius: 12, marginBottom: 12 }}
                        >
                          <Row gutter={12}>
                            <Col span={4}>
                              <Form.Item name={[field.name, 'n']} label="序号" rules={[{ required: true, message: '必填' }]}>
                                <Input placeholder="1" />
                              </Form.Item>
                            </Col>
                            <Col span={10}>
                              <Form.Item name={[field.name, 'title']} label="标题" rules={[{ required: true, message: '必填' }]}>
                                <Input />
                              </Form.Item>
                            </Col>
                            <Col span={10}>
                              <Form.Item name={[field.name, 'desc']} label="描述" rules={[{ required: true, message: '必填' }]}>
                                <Input />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>暂无步骤</div>}
                    </Card>
                  )}
                </Form.List>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card size="small" title="客户案例" style={{ borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={['cases', 'title']} label="标题">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['cases', 'subtitle']} label="副标题">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name={['cases', 'items']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="案例列表"
                      extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add({ offset: false, cat: '', title: '', sub: '', img: '' })}>新增</Button>}
                      style={{ borderRadius: 12 }}
                    >
                      {fields.map(field => (
                        <Card
                          key={field.key}
                          size="small"
                          title={`案例 #${field.name + 1}`}
                          extra={<Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}
                          style={{ borderRadius: 12, marginBottom: 12 }}
                        >
                          <Row gutter={12}>
                            <Col span={6}>
                              <Form.Item name={[field.name, 'offset']} label="错位显示" valuePropName="checked">
                                <Switch />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item name={[field.name, 'cat']} label="分类" rules={[{ required: true, message: '必填' }]}>
                                <Input />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name={[field.name, 'title']} label="标题" rules={[{ required: true, message: '必填' }]}>
                                <Input />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={12}>
                            <Col span={14}>
                              <Form.Item name={[field.name, 'sub']} label="副标题" rules={[{ required: true, message: '必填' }]}>
                                <Input />
                              </Form.Item>
                            </Col>
                            <Col span={10}>
                              <Form.Item name={[field.name, 'img']} label="图片标识/URL" rules={[{ required: true, message: '必填' }]}>
                                <Input placeholder="如：photo-xxxx 或 https://..." />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>暂无案例</div>}
                    </Card>
                  )}
                </Form.List>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card size="small" title="页脚" style={{ borderRadius: 12 }}>
                <Form.Item name={['footer', 'description']} label="简介">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.List name={['footer', 'cols']}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      title="页脚栏目"
                      extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add({ title: '', links: [] })}>新增</Button>}
                      style={{ borderRadius: 12, marginBottom: 12 }}
                    >
                      {fields.map(field => (
                        <Card
                          key={field.key}
                          size="small"
                          title={`栏目 #${field.name + 1}`}
                          extra={<Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}
                          style={{ borderRadius: 12, marginBottom: 12 }}
                        >
                          <Form.Item name={[field.name, 'title']} label="栏目标题" rules={[{ required: true, message: '必填' }]}>
                            <Input />
                          </Form.Item>
                          <Form.List name={[field.name, 'links']}>
                            {(linkFields, { add: addLink, remove: removeLink }) => (
                              <Card
                                size="small"
                                title="链接"
                                extra={<Button type="link" icon={<PlusOutlined />} onClick={() => addLink('')}>新增</Button>}
                                style={{ borderRadius: 12 }}
                              >
                                {linkFields.map(lf => (
                                  <Row key={lf.key} gutter={12} align="middle">
                                    <Col span={21}>
                                      <Form.Item name={lf.name} rules={[{ required: true, message: '必填' }]}>
                                        <Input placeholder="如：ISO 9001 认证" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={3} style={{ textAlign: 'right' }}>
                                      <Button type="text" icon={<MinusCircleOutlined />} onClick={() => removeLink(lf.name)} />
                                    </Col>
                                  </Row>
                                ))}
                                {linkFields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>暂无链接</div>}
                              </Card>
                            )}
                          </Form.List>
                        </Card>
                      ))}
                      {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>暂无栏目</div>}
                    </Card>
                  )}
                </Form.List>

                <Card size="small" title="联系我们" style={{ borderRadius: 12, marginBottom: 12 }}>
                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item name={['footer', 'contact', 'title']} label="标题">
                        <Input placeholder="如：联系我们" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name={['footer', 'contact', 'phone']} label="电话">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name={['footer', 'contact', 'email']} label="邮箱">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name={['footer', 'contact', 'address']} label="地址">
                    <Input />
                  </Form.Item>
                </Card>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={['footer', 'copyright']} label="版权声明">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.List name={['footer', 'legalLinks']}>
                      {(fields, { add, remove }) => (
                        <Card
                          size="small"
                          title="底部链接"
                          extra={<Button type="link" icon={<PlusOutlined />} onClick={() => add('')}>新增</Button>}
                          style={{ borderRadius: 12 }}
                        >
                          {fields.map(field => (
                            <Row key={field.key} gutter={12} align="middle">
                              <Col span={21}>
                                <Form.Item name={field.name} rules={[{ required: true, message: '必填' }]}>
                                  <Input placeholder="如：隐私权条款" />
                                </Form.Item>
                              </Col>
                              <Col span={3} style={{ textAlign: 'right' }}>
                                <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                              </Col>
                            </Row>
                          ))}
                          {fields.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>可选</div>}
                        </Card>
                      )}
                    </Form.List>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>
    </Spin>
  );
}

