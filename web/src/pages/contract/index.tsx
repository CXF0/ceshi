/**
 * @file web/src/pages/contract/index.tsx
 * @version 3.1.0 [2026-04-29]
 * @desc 附件列→所属公司列，新增公司筛选条件
 */
import React, { useState, useEffect } from 'react';
import {
  Table, Input, Card, Tag, message, Space, Row, Col,
  Select, Button, Drawer, Form, InputNumber, DatePicker,
  Divider, Switch, Cascader, Popconfirm, Steps,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined,
  EyeOutlined, ArrowRightOutlined, ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ContractApi } from '@/services/contract';
import { CrmCustomerApi } from '@/services/crm';
import PermButton from '@/components/PermButton';
import request from '@/utils/request';
import { useDeptOptions } from '@/hooks/useDeptOptions'; // ← 新增

const { RangePicker } = DatePicker;

const TH = (label: string) => <span style={{ whiteSpace: 'nowrap' }}>{label}</span>;

const STATUS_CONFIG: Record<string, { color: string; label: string; next?: string; nextLabel?: string }> = {
  draft:  { color: 'default', label: '草稿',   next: 'signed', nextLabel: '确认签约' },
  signed: { color: 'orange',  label: '已签约', next: 'active', nextLabel: '开始执行' },
  active: { color: 'green',   label: '执行中', next: 'closed', nextLabel: '确认结项' },
  closed: { color: 'blue',    label: '已结项' },
};

const STATUS_STEP_LABELS = ['草稿', '已签约', '执行中', '已结项'];

const paymentTypeOptions = [
  { label: '一次性全款', value: 'full' },
  { label: '分2阶段', value: 'stage_2' },
  { label: '分3阶段', value: 'stage_3' },
  { label: '分4阶段', value: 'stage_4' },
  { label: '分5阶段', value: 'stage_5' },
];

const ContractIndex: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { deptOptions, deptMap } = useDeptOptions(); // ← 新增

  const [data, setData]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [total, setTotal]       = useState(0);
  const [addVisible, setAddVisible]   = useState(false);
  const [isEdit, setIsEdit]           = useState(false);
  const [currentRow, setCurrentRow]   = useState<any>(null);
  const [fileList, setFileList]       = useState<any[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: any }[]>([]);
  const [certOptions, setCertOptions] = useState<any[]>([]);
  const [certMap, setCertMap]         = useState<Record<string, { typeName: string; parentName: string }>>({});
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const isRefundValue = Form.useWatch('isRefund', form);

  const [filterContractNo, setFilterContractNo]     = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterStatus, setFilterStatus]             = useState<string | undefined>();
  const [filterCertType, setFilterCertType]         = useState<string | undefined>();
  const [filterDateRange, setFilterDateRange]       = useState<[string, string] | null>(null);
  const [filterDeptId, setFilterDeptId]             = useState<string | undefined>(); // ← 新增

  const [params, setParams] = useState<any>({
    page: 1, pageSize: 10,
    contractNo: '', customerName: '',
    certType: undefined, status: undefined,
    signedDateStart: '', signedDateEnd: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await ContractApi.findAll(params);
      const d = res.data?.data || res.data || res;
      setData(d.items || []);
      setTotal(d.total || 0);
    } catch { message.error('加载合同列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [params]);

  const loadCertData = async () => {
    try {
      const res: any = await request.get('/cert-types');
      let rawList: any[] = Array.isArray(res) ? res
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data : [];
      if (rawList.length > 0) {
        const menuMap: Record<string, any> = {};
        const tMap: Record<string, { typeName: string; parentName: string }> = {};
        rawList.forEach((item: any) => {
          if (!menuMap[item.parent_code]) {
            menuMap[item.parent_code] = { value: item.parent_code, label: item.parent_name, children: [] };
          }
          menuMap[item.parent_code].children.push({ value: item.type_code, label: item.type_name });
          tMap[item.type_code] = { typeName: item.type_name, parentName: item.parent_name };
        });
        setCertOptions(Object.values(menuMap));
        setCertMap(tMap);
      }
    } catch { console.error('认证类型加载失败'); }
  };

  useEffect(() => { loadCertData(); }, []);

  const handleSearch = () => {
    setParams((prev: any) => ({
      ...prev, page: 1,
      contractNo:      filterContractNo,
      customerName:    filterCustomerName,
      status:          filterStatus,
      certType:        filterCertType,
      deptId:          filterDeptId,        // ← 新增
      signedDateStart: filterDateRange?.[0] || '',
      signedDateEnd:   filterDateRange?.[1] || '',
    }));
  };

  const handleReset = () => {
    setFilterContractNo('');
    setFilterCustomerName('');
    setFilterStatus(undefined);
    setFilterCertType(undefined);
    setFilterDateRange(null);
    setFilterDeptId(undefined);             // ← 新增
    setParams({
      page: 1, pageSize: 10,
      contractNo: '', customerName: '',
      certType: undefined, status: undefined,
      signedDateStart: '', signedDateEnd: '',
    });
  };

  const handleSearchCustomer = async (name?: string) => {
    try {
      const res: any = await CrmCustomerApi.findAll({ name: name || undefined, pageSize: 50, page: 1 });
      const list = res.data?.items || res.data?.data?.items || [];
      setCustomerOptions(list.map((i: any) => ({ label: i.name, value: i.id })));
    } catch { console.error('加载客户失败'); }
  };

  useEffect(() => { if (addVisible) handleSearchCustomer(); }, [addVisible]);

  const handleStatusNext = async (record: any) => {
    const cfg = STATUS_CONFIG[record.status];
    if (!cfg?.next) return;
    setStatusUpdating(record.id);
    try {
      await request.patch(`/contracts/${record.id}/status`, { status: cfg.next });
      message.success(`已流转为「${STATUS_CONFIG[cfg.next]?.label}」`);
      fetchData();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '状态更新失败');
    } finally { setStatusUpdating(null); }
  };

  const handleDelete = async (id: string) => {
    try {
      await ContractApi.remove(id);
      message.success('合同已删除');
      fetchData();
    } catch { message.error('删除失败'); }
  };

  const onFinish = async (values: any) => {
    const { dateRange, signedDate, isRefund, certTypeDisplay, ...rest } = values;
    const postData = {
      ...rest,
      isRefund:   isRefund ? 1 : 0,
      startDate:  dateRange?.[0]?.format('YYYY-MM-DD') || null,
      endDate:    dateRange?.[1]?.format('YYYY-MM-DD') || null,
      signedDate: signedDate?.format('YYYY-MM-DD') || null,
      certType:   certTypeDisplay?.length ? certTypeDisplay[certTypeDisplay.length - 1] : null,
    };
    try {
      if (isEdit && currentRow) {
        await ContractApi.update(currentRow.id, postData);
        message.success('更新成功');
      } else {
        await ContractApi.create(postData);
        message.success('起草成功');
      }
      setAddVisible(false);
      fetchData();
    } catch { message.error('保存失败'); }
  };

  const openEdit = (record: any) => {
    setIsEdit(true);
    setCurrentRow(record);
    setAddVisible(true);
    if (record.customerId && record.customer?.name) {
      setCustomerOptions([{ label: record.customer.name, value: record.customerId }]);
    }
    setFileList(record.attachmentUrl
      ? [{ uid: '-1', name: record.attachmentUrl.split('/').pop(), status: 'done', url: record.attachmentUrl }]
      : []);
    let certCascader: string[] = [];
    if (record.certType) {
      const parent = certOptions.find((p: any) => p.children?.some((c: any) => c.value === record.certType));
      certCascader = parent ? [parent.value, record.certType] : [record.certType];
    }
    form.setFieldsValue({
      ...record,
      isRefund:        record.isRefund === 1,
      certTypeDisplay: certCascader,
      dateRange:       record.startDate ? [dayjs(record.startDate), dayjs(record.endDate)] : null,
      signedDate:      record.signedDate ? dayjs(record.signedDate) : null,
    });
  };

  const columns: ColumnsType<any> = [
    {
      title: TH('认证类型'), dataIndex: 'certType', width: 180,
      render: (v) => {
        if (!v) return '--';
        const info = certMap[v];
        return (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 500, color: '#1677ff' }}>{info?.typeName || v}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{info?.parentName || '--'}</div>
          </div>
        );
      },
    },
    { title: TH('认证主体'), dataIndex: ['customer', 'name'], ellipsis: true, width: 180 },
    {
      title: TH('合同编号'), dataIndex: 'contractNo', width: 140,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: TH('总金额'), dataIndex: 'totalAmount', width: 110,
      render: (v) => <span style={{ color: '#cf1322', fontWeight: 600 }}>¥{Number(v).toLocaleString()}</span>,
    },
    {
      title: TH('合同状态'), dataIndex: 'status', width: 100,
      render: (s) => {
        const cfg = STATUS_CONFIG[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: TH('状态流转'), key: 'flow', width: 110,
      render: (_, record) => {
        const cfg = STATUS_CONFIG[record.status];
        if (!cfg?.next) return <Tag color="blue">已结项</Tag>;
        return (
          <PermButton perm="/contract:edit" type="link" size="small"
            icon={<ArrowRightOutlined />} loading={statusUpdating === record.id}
            onClick={() => handleStatusNext(record)} style={{ padding: 0 }}>
            {cfg.nextLabel}
          </PermButton>
        );
      },
    },
    {
      title: TH('回款方式'), dataIndex: 'paymentType', width: 110,
      render: (v) => paymentTypeOptions.find(o => o.value === v)?.label || v,
    },
    { title: TH('签约日期'), dataIndex: 'signedDate', width: 110 },
    // ✅ 附件列 → 所属公司列
    {
      title: TH('所属公司'),
      dataIndex: 'deptId',
      width: 200,
      render: (deptId: string, record: any) => {
        const name = record.dept?.deptName || deptMap[deptId] || deptId;
        return <Tag color="cyan">{name}</Tag>;
      },
    },
    {
      title: TH('操作'), key: 'action', fixed: 'right', width: 240,
      render: (_, record) => (
        <Space size={0} split={<Divider type="vertical" />}>
          <PermButton perm="/contract:view" type="link" size="small" icon={<EyeOutlined />}
            onClick={() => navigate(`/contract/${record.id}`)}>详情</PermButton>
          <PermButton perm="/contract:edit" type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}>编辑</PermButton>
          <PermButton perm="/contract:delete" type="link" size="small" danger icon={<DeleteOutlined />} asChild>
            <Popconfirm title="确认删除该合同？" description="删除后数据不可恢复"
              onConfirm={() => handleDelete(record.id)} okType="danger">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </PermButton>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<Space><FileTextOutlined style={{ color: '#71ccbc' }} /><span>合同协议管理</span></Space>}
      extra={
        <PermButton perm="/contract:add" type="primary" icon={<PlusOutlined />}
          onClick={() => { setIsEdit(false); form.resetFields(); setFileList([]); setAddVisible(true); }}>
          起草合同
        </PermButton>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="150px">
            <Input placeholder="合同编号" prefix={<SearchOutlined />} allowClear
              value={filterContractNo} onChange={e => setFilterContractNo(e.target.value)}
              onPressEnter={handleSearch} />
          </Col>
          <Col flex="150px">
            <Input placeholder="认证主体名称" prefix={<SearchOutlined />} allowClear
              value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)}
              onPressEnter={handleSearch} />
          </Col>
          <Col flex="120px">
            <Select placeholder="合同状态" style={{ width: '100%' }} allowClear
              value={filterStatus} onChange={v => setFilterStatus(v)}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '已签约', value: 'signed' },
                { label: '执行中', value: 'active' },
                { label: '已结项', value: 'closed' },
              ]} />
          </Col>
          <Col flex="210px">
            <RangePicker style={{ width: '100%' }} placeholder={['签约开始', '签约结束']}
              onChange={(dates) => setFilterDateRange(
                dates ? [dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')] : null
              )} />
          </Col>
          {/* ✅ 新增：公司筛选 */}
          {deptOptions.length > 1 && (
            <Col flex="240px">
              <Select placeholder="所属公司" style={{ width: '100%' }} allowClear
                value={filterDeptId} onChange={v => setFilterDeptId(v)}
                options={deptOptions} />
            </Col>
          )}
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fafafa', borderRadius: 8 }}>
        <Steps size="small" current={-1}
          items={STATUS_STEP_LABELS.map((label, i) => ({
            title: label, status: 'wait' as const,
            description: i < STATUS_STEP_LABELS.length - 1 ? '→' : '终态',
          }))} />
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          current: params.page, pageSize: params.pageSize, total,
          showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => setParams((prev: any) => ({ ...prev, page: p, pageSize: s })),
        }} />

      {/* ── 起草/编辑抽屉 ── */}
      <Drawer title={isEdit ? '修改合同要素' : '起草新合同'} width={640}
        open={addVisible} onClose={() => setAddVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setAddVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>确认保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}
          initialValues={{ status: 'draft', paymentType: 'full', isRefund: false, refundAmount: 0 }}>
          <Divider style={{ margin: '0 0 16px' }}>基本信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contractNo" label="合同编号" rules={[{ required: true }]}>
                <Input placeholder="请输入内部合同号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerId" label="认证主体" rules={[{ required: true }]}>
                <Select showSearch placeholder="搜索并选择客户"
                  onSearch={handleSearchCustomer} options={customerOptions} filterOption={false} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="certTypeDisplay" label="认证类型项目" rules={[{ required: true, message: '请选择认证类型' }]}>
            <Cascader options={certOptions} placeholder="请选择所属体系及具体项目"
              expandTrigger="hover" style={{ width: '100%' }} />
          </Form.Item>
          <Divider style={{ margin: '8px 0 16px' }}>收支详情</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalAmount" label="合同总金额">
                <InputNumber style={{ width: '100%' }} precision={2} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentType" label="回款约定">
                <Select options={paymentTypeOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isRefund" label="是否涉及返款" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            {isRefundValue && (
              <Col span={16}>
                <Form.Item name="refundAmount" label="返款金额">
                  <InputNumber style={{ width: '100%' }} precision={2} prefix="¥" />
                </Form.Item>
              </Col>
            )}
          </Row>
          <Divider style={{ margin: '8px 0 16px' }}>有效期与状态</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="signedDate" label="签约日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="当前状态">
                <Select options={[
                  { label: '草稿', value: 'draft' },
                  { label: '已签约', value: 'signed' },
                  { label: '执行中', value: 'active' },
                  { label: '已结项', value: 'closed' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dateRange" label="服务有效期（起止）">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="选填，可填写合同特别约定等内容" />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
};

export default ContractIndex;