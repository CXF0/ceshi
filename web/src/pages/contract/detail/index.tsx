/**
 * @file web/src/pages/contract/detail/index.tsx
 * @version 2.0.0 [2026-04-28]
 * @desc 合同详情独立页：基本信息 + 状态流转 + 回款管理 + 多附件管理
 */
import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Descriptions, Tag, Button, Space, Divider,
  Table, Modal, Form, Input, InputNumber, DatePicker, Switch,
  message, Spin, Steps, Upload, Tooltip, Popconfirm, Progress,
  Statistic, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined, EditOutlined, ArrowRightOutlined,
  PlusOutlined, DeleteOutlined, CheckOutlined, PaperClipOutlined,
  UploadOutlined, EyeOutlined, FileTextOutlined, DollarOutlined,
  CalendarOutlined, UserOutlined, SafetyCertificateOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import request from '@/utils/request';
import PermButton from '@/components/PermButton';
import {
  getPaymentsByContract, createPayment, updatePayment, deletePayment,
  type FinPaymentItem,
} from '@/services/fin-payments';

// ── 状态配置 ──────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; label: string; next?: string; nextLabel?: string; step: number }> = {
  draft:  { color: 'default', label: '草稿',   next: 'signed', nextLabel: '确认签约', step: 0 },
  signed: { color: 'orange',  label: '已签约', next: 'active', nextLabel: '开始执行', step: 1 },
  active: { color: 'green',   label: '执行中', next: 'closed', nextLabel: '确认结项', step: 2 },
  closed: { color: 'blue',    label: '已结项', step: 3 },
};

const paymentTypeMap: Record<string, string> = {
  full: '一次性全款', stage_2: '分2阶段', stage_3: '分3阶段',
  stage_4: '分4阶段', stage_5: '分5阶段',
};

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contract, setContract]     = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [certMap, setCertMap]       = useState<Record<string, { typeName: string; parentName: string }>>({});

  // 回款
  const [payments, setPayments]     = useState<FinPaymentItem[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editingPay, setEditingPay] = useState<FinPaymentItem | null>(null);
  const [payForm] = Form.useForm();

  // 附件
  const [attachments, setAttachments] = useState<{ name: string; url: string; size?: number }[]>([]);
  const [uploading, setUploading]     = useState(false);

  // 状态流转
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ── 加载合同详情 ──────────────────────────────────────
  const loadContract = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await request.get(`/contracts/${id}`);
      const data = res.data?.data || res.data || res;
      setContract(data);
      // 解析附件
      const atts = Array.isArray(data.attachments) ? data.attachments
        : (data.attachments ? JSON.parse(data.attachments) : []);
      // 兼容旧单附件
      if (data.attachmentUrl && !atts.some((a: any) => a.url === data.attachmentUrl)) {
        atts.unshift({ name: data.attachmentUrl.split('/').pop(), url: data.attachmentUrl });
      }
      setAttachments(atts);
    } catch { message.error('加载合同详情失败'); }
    finally { setLoading(false); }
  };

  // ── 加载认证类型映射 ─────────────────────────────────
  const loadCertMap = async () => {
    try {
      const res: any = await request.get('/cert-types');
      const rawList: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      const tMap: Record<string, { typeName: string; parentName: string }> = {};
      rawList.forEach(item => {
        tMap[item.type_code] = { typeName: item.type_name, parentName: item.parent_name };
      });
      setCertMap(tMap);
    } catch {}
  };

  // ── 加载回款记录 ─────────────────────────────────────
  const loadPayments = async () => {
  if (!id) return;
  setPayLoading(true);
  try {
    const res: any = await getPaymentsByContract(id);
    // request 拦截器返回完整 axios 响应，后端结构为 { code, data: [] }
    // 实际数组在 res.data.data
    const list = res?.data?.data ?? res?.data ?? res ?? [];
    setPayments(Array.isArray(list) ? list : []);
  } catch { message.error('加载回款记录失败'); }
  finally { setPayLoading(false); }
};

  useEffect(() => {
    loadContract();
    loadCertMap();
    loadPayments();
  }, [id]);

  // ── 状态流转 ──────────────────────────────────────────
  const handleStatusNext = async () => {
    if (!contract) return;
    const cfg = STATUS_CONFIG[contract.status];
    if (!cfg?.next) return;
    setStatusUpdating(true);
    try {
      await request.patch(`/contracts/${id}/status`, { status: cfg.next });
      message.success(`已流转为「${STATUS_CONFIG[cfg.next]?.label}」`);
      loadContract();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '状态更新失败');
    } finally { setStatusUpdating(false); }
  };

  // ── 附件上传 ──────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await request.post('/contracts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileData = res.data?.data || res.data || res;
      const newAtts = [...attachments, { name: fileData.name || file.name, url: fileData.url, size: fileData.size }];
      setAttachments(newAtts);
      // 同步保存到合同
      await request.put(`/contracts/${id}`, { attachments: newAtts });
      message.success('附件上传成功');
    } catch { message.error('上传失败'); }
    finally { setUploading(false); }
    return false; // 阻止默认行为
  };

  const handleDeleteAttachment = async (url: string) => {
    const newAtts = attachments.filter(a => a.url !== url);
    setAttachments(newAtts);
    await request.put(`/contracts/${id}`, { attachments: newAtts });
    message.success('附件已移除');
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  // ── 回款 CRUD ─────────────────────────────────────────
  const openPayModal = (record?: FinPaymentItem) => {
    payForm.resetFields();
    setEditingPay(record || null);
    if (record) {
      payForm.setFieldsValue({
        ...record,
        paymentDate: record.paymentDate ? dayjs(record.paymentDate) : null,
        isInvoiced: record.isInvoiced === 1,
      });
    }
    setPayModalOpen(true);
  };

  const handlePaySubmit = async () => {
    const values = await payForm.validateFields();
    const payload: FinPaymentItem = {
      ...values,
      contractId: id!,
      isInvoiced: values.isInvoiced ? 1 : 0,
      paymentDate: values.paymentDate?.format('YYYY-MM-DD') || null,
    };
    try {
      if (editingPay?.id) {
        await updatePayment(editingPay.id, payload);
        message.success('回款记录已更新');
      } else {
        await createPayment(payload);
        message.success('回款阶段已添加');
      }
      setPayModalOpen(false);
      loadPayments();
    } catch { message.error('保存失败'); }
  };

  const handlePayDelete = async (payId: string) => {
    try {
      await deletePayment(payId);
      message.success('已删除');
      loadPayments();
    } catch { message.error('删除失败'); }
  };

  // ── 回款统计 ─────────────────────────────────────────
  const totalDue  = payments.reduce((s, p) => s + (p.amountDue || 0), 0);
const totalPaid = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
// 进度以合同总额为分母，避免回款阶段金额超出合同额时显示异常
const contractTotal = Number(contract?.totalAmount) || 0;
const paidRate = contractTotal > 0
  ? Math.min(Math.round((totalPaid / contractTotal) * 100), 100)
  : (totalDue > 0 ? Math.min(Math.round((totalPaid / totalDue) * 100), 100) : 0);

  // ── 回款表格列 ────────────────────────────────────────
  const payColumns: ColumnsType<FinPaymentItem> = [
    { title: '阶段名称', dataIndex: 'phaseName', width: 120 },
    {
      title: '应收金额', dataIndex: 'amountDue', width: 120,
      render: v => <span style={{ color: '#cf1322', fontWeight: 600 }}>¥{Number(v).toLocaleString()}</span>,
    },
    {
      title: '实收金额', dataIndex: 'amountPaid', width: 120,
      render: (v, record) => (
        <span style={{ color: (record.amountPaid || 0) >= (record.amountDue || 0) ? '#52c41a' : '#faad14', fontWeight: 600 }}>
          ¥{Number(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '是否开票', dataIndex: 'isInvoiced', width: 90,
      render: v => v === 1 ? <Tag color="green">已开票</Tag> : <Tag color="default">未开票</Tag>,
    },
    {
      title: '收款日期', dataIndex: 'paymentDate', width: 110,
      render: v => v || <span style={{ color: '#d9d9d9' }}>未收款</span>,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openPayModal(record)}>编辑</Button>
          <Popconfirm title="确认删除此回款记录？" onConfirm={() => handlePayDelete(record.id!)} okType="danger">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large"><div style={{ padding: 20, color: '#999' }}>加载中...</div></Spin></div>;
  }

  if (!contract) {
    return <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>合同不存在或已被删除</div>;
  }

  const statusCfg = STATUS_CONFIG[contract.status] || { color: 'default', label: contract.status, step: 0 };
  const certInfo  = certMap[contract.certType];

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* ── 顶部操作栏 ── */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contract')}>返回列表</Button>
              <Divider type="vertical" />
              <FileTextOutlined style={{ color: '#71ccbc', fontSize: 18 }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                {contract.contractNo}
              </span>
              <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              {statusCfg.next && (
                <PermButton
                  perm="/contract:edit"
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  loading={statusUpdating}
                  onClick={handleStatusNext}
                >
                  {statusCfg.nextLabel}
                </PermButton>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ── 状态进度条 ── */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Steps
          current={statusCfg.step}
          items={[
            { title: '草稿',   icon: <EditOutlined /> },
            { title: '已签约', icon: <SafetyCertificateOutlined /> },
            { title: '执行中', icon: <CalendarOutlined /> },
            { title: '已结项', icon: <CheckOutlined /> },
          ]}
        />
      </Card>

      <Row gutter={16}>
        {/* ── 左列：基本信息 + 附件 ── */}
        <Col xs={24} lg={14}>
          {/* 基本信息 */}
          <Card
            bordered={false}
            style={{ borderRadius: 12, marginBottom: 16 }}
            title={<Space><UserOutlined style={{ color: '#71ccbc' }} />合同基本信息</Space>}
          >
            <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }}>
              <Descriptions.Item label="认证主体" span={2}>
                <span style={{ fontWeight: 600, color: '#1677ff', fontSize: 15 }}>
                  {contract.customer?.name || '--'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="认证类型" span={2}>
                {certInfo ? (
                  <span>
                    <Tag color="blue">{certInfo.parentName}</Tag>
                    <span style={{ fontWeight: 500 }}>{certInfo.typeName}</span>
                  </span>
                ) : contract.certType || '--'}
              </Descriptions.Item>
              <Descriptions.Item label="合同编号">
                <span style={{ fontFamily: 'monospace' }}>{contract.contractNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="合同总额">
                <span style={{ color: '#cf1322', fontWeight: 700, fontSize: 15 }}>
                  ¥{Number(contract.totalAmount).toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="回款方式">
                {paymentTypeMap[contract.paymentType] || contract.paymentType}
              </Descriptions.Item>
              <Descriptions.Item label="是否返款">
                {contract.isRefund === 1
                  ? <Tag color="magenta">有返款 ¥{Number(contract.refundAmount).toLocaleString()}</Tag>
                  : <Tag color="default">无</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="签约日期">{contract.signedDate || '--'}</Descriptions.Item>
              <Descriptions.Item label="服务有效期">
                {contract.startDate && contract.endDate
                  ? `${contract.startDate} 至 ${contract.endDate}`
                  : '--'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{contract.createBy || '--'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                <span style={{ color: '#595959' }}>{contract.remark || '—'}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 附件管理 */}
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            title={<Space><PaperClipOutlined style={{ color: '#71ccbc' }} />合同附件</Space>}
            extra={
              <PermButton perm="/contract:upload" type="dashed" size="small" icon={<UploadOutlined />} asChild>
                <Upload
                  showUploadList={false}
                  beforeUpload={handleUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.zip"
                >
                  <Button
                    type="dashed"
                    size="small"
                    icon={<UploadOutlined />}
                    loading={uploading}
                  >
                    上传附件
                  </Button>
                </Upload>
              </PermButton>
            }
          >
            {attachments.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0' }}>
                暂无附件，点击右上角上传
              </div>
            ) : (
              <div>
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                      background: '#fafafa', border: '1px solid #f0f0f0',
                    }}
                  >
                    <Space>
                      <PaperClipOutlined style={{ color: '#71ccbc' }} />
                      <span style={{ fontSize: 13 }}>{att.name}</span>
                      {att.size && <span style={{ fontSize: 11, color: '#bbb' }}>{formatSize(att.size)}</span>}
                    </Space>
                    <Space>
                      <Tooltip title="预览/下载">
                        <Button
                          type="link" size="small" icon={<EyeOutlined />}
                          onClick={() => window.open(att.url, '_blank')}
                        />
                      </Tooltip>
                      <Tooltip title="下载">
                        <Button
                          type="link" size="small" icon={<DownloadOutlined />}
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = att.url; a.download = att.name; a.click();
                          }}
                        />
                      </Tooltip>
                      <Popconfirm title="确认移除该附件？" onConfirm={() => handleDeleteAttachment(att.url)} okType="danger">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* ── 右列：回款管理 ── */}
        <Col xs={24} lg={10}>
          {/* 回款统计卡片 */}
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>合同总额</span>}
                  value={contract.totalAmount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ fontSize: 16, color: '#1677ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>已回款</span>}
                  value={totalPaid}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ fontSize: 16, color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>待回款</span>}
                  value={Math.max(0, contractTotal - totalPaid)}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ fontSize: 16, color: totalDue > totalPaid ? '#faad14' : '#52c41a' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>回款进度</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{paidRate}%</span>
              </div>
              <Progress
                percent={paidRate}
                strokeColor={paidRate >= 100 ? '#52c41a' : '#71ccbc'}
                trailColor="#f0f0f0"
                showInfo={false}
              />
            </div>
          </Card>

          {/* 回款记录 */}
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            title={
              <Space>
                <DollarOutlined style={{ color: '#71ccbc' }} />
                <span>回款阶段记录</span>
                <Badge count={payments.length} style={{ backgroundColor: '#71ccbc' }} />
              </Space>
            }
            extra={
              <PermButton
                perm="/contract:edit"
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => openPayModal()}
              >
                新增阶段
              </PermButton>
            }
          >
            <Table
              dataSource={payments}
              columns={payColumns}
              rowKey="id"
              loading={payLoading}
              size="small"
              pagination={false}
              scroll={{ x: 500 }}
              locale={{ emptyText: '暂无回款记录，点击「新增阶段」添加' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── 回款编辑 Modal ── */}
      <Modal
        title={editingPay ? '编辑回款记录' : '新增回款阶段'}
        open={payModalOpen}
        onOk={handlePaySubmit}
        onCancel={() => setPayModalOpen(false)}
        width={480}
        destroyOnClose
        okText="确认保存"
      >
        <Form form={payForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="phaseName" label="阶段名称" rules={[{ required: true }]}>
            <Input placeholder="如：首款、阶段二、尾款" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amountDue" label="应收金额" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} precision={2} prefix="¥" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amountPaid" label="实收金额">
                <InputNumber style={{ width: '100%' }} precision={2} prefix="¥" min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentDate" label="收款日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isInvoiced" label="是否已开票" valuePropName="checked">
                <Switch checkedChildren="已开票" unCheckedChildren="未开票" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractDetail;