/**
 * 目录结构: src/pages/contract/index.tsx
 * 功能: 合同协议管理（数据库驱动：认证类型动态获取、翻译、搜索全量补全）
 */
import React, { useState, useEffect } from 'react';
import { 
  Table, Input, Card, Tag, message, Space, Row, Col, 
  Select, Button, Drawer, Form, InputNumber, DatePicker, Descriptions, Upload, Divider, Switch, Cascader
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  SearchOutlined, PlusOutlined, 
  PaperClipOutlined, UploadOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ContractApi } from '@/services/contract'; 
import { CrmCustomerApi } from '@/services/crm';
import request from '@/utils/request'; 

const { RangePicker } = DatePicker;

const ContractIndex: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [addVisible, setAddVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ label: string, value: any }[]>([]);
  
  // 💡 动态认证类型状态
  const [certOptions, setCertOptions] = useState<any[]>([]);
  const [certMap, setCertMap] = useState<Record<string, {typeName: string, parentName: string}>>({});

  const isRefundValue = Form.useWatch('isRefund', form);

  const [params, setParams] = useState({ 
    page: 1, 
    pageSize: 10, 
    contractNo: '', 
    customerName: '', 
    certType: undefined as string | undefined, 
    status: undefined,
    signedDateStart: '', 
    signedDateEnd: '',   
  });

  const statusMap: any = { 
    active: ['green', '执行中'], 
    closed: ['blue', '已结项'], 
    draft: ['default', '草稿'], 
    signed: ['orange', '已签约'] 
  };

  const paymentTypeOptions = [
    { label: '一次性全款', value: 'full' },
    { label: '分2阶段', value: 'stage_2' },
    { label: '分3阶段', value: 'stage_3' },
    { label: '分4阶段', value: 'stage_4' },
    { label: '分5阶段', value: 'stage_5' }
  ];

/**
   * 💡 核心：加载后端数据库驱动的认证类型
   */
  const loadCertData = async () => {
    try {
      const res: any = await request.get('/cert-types');
      
      // 这里的处理是为了确保能拿到那个 24 条数据的数组
      // 无论你的拦截器返回的是 res 还是 res.data
      let rawList = [];
      if (Array.isArray(res)) {
        rawList = res;
      } else if (res?.data && Array.isArray(res.data)) {
        rawList = res.data;
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        rawList = res.data.data;
      }
      
      console.log('检查获取到的原始数据:', rawList); // 你可以在控制台看一下是否打印了数组

      if (rawList && rawList.length > 0) {
        const menuMap: Record<string, any> = {};
        const translationMap: Record<string, {typeName: string, parentName: string}> = {};

        rawList.forEach((item: any) => {
          // 1. 构建 Cascader 分组树 (针对搜索框和表单)
          if (!menuMap[item.parent_code]) {
            menuMap[item.parent_code] = {
              label: item.parent_name,
              value: item.parent_code,
              children: []
            };
          }
          menuMap[item.parent_code].children.push({
            label: item.type_name,
            value: item.type_code
          });
          // 2. 构建翻译映射表 (针对表格列的 render 渲染)
          translationMap[item.type_code] = {
            typeName: item.type_name,
            parentName: item.parent_name
          };
        });

        const finalOptions = Object.values(menuMap);
        setCertOptions(finalOptions);
        setCertMap(translationMap);
        
        console.log('处理后的级联选项:', finalOptions);
        console.log('处理后的映射表:', translationMap);
      } else {
        console.warn('未获取到认证类型数组，请检查接口返回结构');
      }
    } catch (e) {
      console.error('加载认证字典失败', e);
      message.error('认证类型加载异常');
    }
  };

  const getFileName = (url: string | undefined) => {
    if (!url) return '';
    const fullFileName = url.split('/').pop() || '';
    const dashIndex = fullFileName.indexOf('-');
    return dashIndex !== -1 ? fullFileName.substring(dashIndex + 1) : fullFileName;
  };

  const handleFilePreview = (url: string | undefined) => {
    if (!url) return message.warning('暂无附件可预览');
    const extension = url.split('.').pop()?.toLowerCase();
    const fileName = url.split('/').pop();
    const absoluteUrl = `${window.location.origin}/static/${fileName}`;

    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocal) {
        const link = document.createElement('a');
        link.href = absoluteUrl;
        link.download = getFileName(url);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`, '_blank');
      }
    } else {
      window.open(absoluteUrl, '_blank');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await ContractApi.findAll(params);
      const list = res.data?.items || res.data?.data?.items || [];
      const totalCount = res.data?.total || res.data?.data?.total || 0;
      setData(list);
      setTotal(totalCount);
    } catch (e) { 
      message.error('加载列表失败'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    loadCertData(); 
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [params]);

  const handleSearchCustomer = async (name?: string) => {
    try {
      const res: any = await CrmCustomerApi.findAll({ 
        name: name || undefined, 
        pageSize: 50,
        page: 1 
      });
      const list = res.data?.items || res.data?.data?.items || [];
      setCustomerOptions(list.map((i: any) => ({ label: i.name, value: i.id })));
    } catch (e) {
      console.error('加载客户列表失败', e);
    }
  };

  useEffect(() => {
    if (addVisible) {
      handleSearchCustomer(); 
    }
  }, [addVisible]);

  const onFinish = async (values: any) => {
    const { dateRange, signedDate, isRefund, certTypeDisplay, ...rest } = values;
    const postData = {
      ...rest,
      isRefund: isRefund ? 1 : 0, 
      startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : null,
      endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : null,
      signedDate: signedDate ? signedDate.format('YYYY-MM-DD') : null,
      certType: certTypeDisplay && certTypeDisplay.length > 0 ? certTypeDisplay[certTypeDisplay.length - 1] : null,
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
    } catch (e) {
      message.error('保存失败');
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: '认证类型',
      dataIndex: 'certType',
      width: 220,
      render: (v) => {
        if (!v) return '--';
        const info = certMap[v];
        // 还原你的原始设计：上方认证类型，下方大类
        return (
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontWeight: 500, color: '#1677ff' }}>{info?.typeName || v}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>{info?.parentName || '--'}</div>
          </div>
        );
      }
    },
    { 
      title: '认证主体', 
      dataIndex: ['customer', 'name'], 
      ellipsis: true, 
      width: 200 
    },
    { title: '总金额', dataIndex: 'totalAmount', width: 110, render: (v) => `¥${Number(v).toLocaleString()}` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 90, 
      render: (s) => {
        const item = statusMap[s] || ['default', s];
        return <Tag color={item[0]}>{item[1]}</Tag>;
      } 
    },
    { 
      title: '回款方式', 
      dataIndex: 'paymentType', 
      width: 120,
      render: (v) => paymentTypeOptions.find(o => o.value === v)?.label || v
    },
    { 
      title: '返款', 
      dataIndex: 'isRefund', 
      width: 80, 
      render: (v) => v === 1 ? <Tag color="magenta">有</Tag> : <Tag color="blue">无</Tag>
    },
    { title: '签约日期', dataIndex: 'signedDate', width: 110 },
    { 
      title: '附件', 
      dataIndex: 'attachmentUrl', 
      width: 150,
      ellipsis: true,
      render: (url) => url ? (
        <Button 
          type="link" 
          size="small" 
          onClick={() => handleFilePreview(url)} 
          icon={<PaperClipOutlined />} 
          style={{ padding: 0, color: '#71ccbc' }}
          title={getFileName(url)}
        >
          {getFileName(url)}
        </Button>
      ) : '--' 
    },
    { 
      title: '操作', 
      fixed: 'right', 
      width: 120, 
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setCurrentRow(r); setDetailVisible(true); }}>详情</Button>
          <Button type="link" size="small" onClick={() => { 
            setIsEdit(true); 
            setCurrentRow(r); 
            setAddVisible(true); 
            if (r.customerId && r.customer?.name) {
              setCustomerOptions([{ label: r.customer.name, value: r.customerId }]);
            }
            const name = getFileName(r.attachmentUrl);
            setFileList(r.attachmentUrl ? [{ uid: '-1', name, status: 'done', url: r.attachmentUrl }] : []); 
            
            let certCascader: string[] = [];
            if (r.certType) {
              const parent = certOptions.find(p => p.children.some((c: any) => c.value === r.certType));
              certCascader = parent ? [parent.value, r.certType] : [r.certType];
            }

            form.setFieldsValue({ 
              ...r, 
              isRefund: r.isRefund === 1,
              certTypeDisplay: certCascader,
              dateRange: r.startDate ? [dayjs(r.startDate), dayjs(r.endDate)] : null, 
              signedDate: r.signedDate ? dayjs(r.signedDate) : null 
            }); 
          }}>编辑</Button>
        </Space>
      )
    },
  ];

  return (
    <Card 
      title={<span><FileTextOutlined style={{ marginRight: 8 }} />合同协议管理</span>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setIsEdit(false); form.resetFields(); setFileList([]); setAddVisible(true); }}>起草合同</Button>}
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Input 
              placeholder="合同号搜索" 
              prefix={<SearchOutlined />} 
              allowClear 
              onPressEnter={e => setParams({...params, contractNo: (e.target as any).value, page: 1})} 
            />
          </Col>
          <Col span={4}>
            <Input 
              placeholder="客户名(认证主体)" 
              prefix={<SearchOutlined />} 
              allowClear 
              onChange={e => setParams({...params, customerName: e.target.value, page: 1})} 
            />
          </Col>
          <Col span={5}>
            <Cascader
              options={certOptions}
              placeholder="认证类型筛选"
              allowClear
              expandTrigger="hover"
              style={{ width: '100%' }}
              onChange={(v) => setParams({...params, certType: v ? v[v.length - 1] as string : undefined, page: 1})}
            />
          </Col>
          <Col span={6}>
            <RangePicker 
              style={{ width: '100%' }}
              placeholder={['签约开始', '签约结束']}
              onChange={(dates) => {
                setParams({
                  ...params,
                  page: 1,
                  signedDateStart: dates ? dates[0]!.format('YYYY-MM-DD') : '',
                  signedDateEnd: dates ? dates[1]!.format('YYYY-MM-DD') : '',
                });
              }}
            />
          </Col>
          <Col span={3}>
            <Select 
              placeholder="状态" 
              allowClear 
              style={{ width: '100%' }} 
              onChange={v => setParams({...params, status: v, page: 1})} 
              options={[{ label: '执行中', value: 'active' }, { label: '已结项', value: 'closed' }, { label: '草稿', value: 'draft' }]} 
            />
          </Col>
        </Row>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading} 
        scroll={{ x: 1400 }}
        pagination={{ 
          current: params.page, 
          pageSize: params.pageSize, 
          total: total, 
          onChange: (p) => setParams({ ...params, page: p }),
          showTotal: (t) => `共 ${t} 条`
        }} 
      />
      
      <Drawer 
        title={isEdit ? "修改合同要素" : "起草新合同"} 
        width={640} 
        open={addVisible} 
        onClose={() => setAddVisible(false)} 
        footer={<Space style={{ float: 'right' }}><Button onClick={() => setAddVisible(false)}>取消</Button><Button type="primary" onClick={() => form.submit()}>确认保存</Button></Space>}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish} 
          initialValues={{ status: 'draft', paymentType: 'full', isRefund: false, refundAmount: 0 }}
        >
          <Divider style={{ margin: '0 0 16px' }}>基本信息</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="contractNo" label="合同编号" rules={[{ required: true }]}><Input placeholder="请输入内部合同号" /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="customerId" label="认证主体" rules={[{ required: true }]}>
                <Select showSearch placeholder="搜索并选择客户" onSearch={handleSearchCustomer} options={customerOptions} filterOption={false} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="certTypeDisplay" label="认证类型项目" rules={[{ required: true, message: '请选择认证类型' }]}>
                <Cascader options={certOptions} placeholder="请选择所属体系及具体项目" expandTrigger="hover" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }}>收支详情</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="totalAmount" label="合同总金额"><InputNumber style={{ width: '100%' }} precision={2} prefix="¥" /></Form.Item></Col>
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
                  <InputNumber style={{ width: '100%' }} precision={2} prefix="¥" placeholder="请输入返款金额" />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Divider style={{ margin: '16px 0' }}>有效期与状态</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="signedDate" label="签约日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="当前状态"><Select options={[{label:'草稿', value:'draft'}, {label:'已签约', value:'signed'}, {label:'执行中', value:'active'}, {label:'已结项', value:'closed'}]} /></Form.Item></Col>
          </Row>
          <Form.Item name="dateRange" label="服务有效期（起止）"><RangePicker style={{ width: '100%' }} /></Form.Item>

          <Divider style={{ margin: '16px 0' }}>附件存档</Divider>
          <Form.Item label="合同附件扫描件" name="attachmentUrl">
            <Upload 
              action="/api/contracts/upload" 
              headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
              fileList={fileList}
              onChange={info => {
                setFileList(info.fileList);
                if (info.file.status === 'done') form.setFieldsValue({ attachmentUrl: info.file.response.url });
              }}
            >
              <Button icon={<UploadOutlined />}>上传扫描件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer title="合同详细要素查看" width={800} open={detailVisible} onClose={() => setDetailVisible(false)}>
        {currentRow && (
          <>
            <Descriptions title="核心条款" bordered column={2} size="small">
              <Descriptions.Item label="认证主体" span={2}>{currentRow.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="认证类型">
                {certMap[currentRow.certType]?.typeName} ({certMap[currentRow.certType]?.parentName})
              </Descriptions.Item>
              <Descriptions.Item label="合同编号">{currentRow.contractNo}</Descriptions.Item>
              <Descriptions.Item label="合同总金额">
                <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{Number(currentRow.totalAmount).toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="合同状态">
                <Tag color={statusMap[currentRow.status]?.[0] || 'default'}>
                  {statusMap[currentRow.status]?.[1] || currentRow.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="回款约定">
                {paymentTypeOptions.find(o => o.value === currentRow.paymentType)?.label || currentRow.paymentType}
              </Descriptions.Item>
              <Descriptions.Item label="签约日期">{currentRow.signedDate || '--'}</Descriptions.Item>
              <Descriptions.Item label="有效期" span={2}>
                {currentRow.startDate} <span style={{ color: '#ccc' }}>至</span> {currentRow.endDate}
              </Descriptions.Item>
            </Descriptions>

            <Divider dashed />

            <Descriptions title="返款及附加" bordered column={2} size="small">
              <Descriptions.Item label="是否返款">
                {currentRow.isRefund === 1 ? <Tag color="magenta">涉及返款</Tag> : '无返款'}
              </Descriptions.Item>
              <Descriptions.Item label="返款金额">
                {currentRow.isRefund === 1 ? `¥${Number(currentRow.refundAmount).toLocaleString()}` : '--'}
              </Descriptions.Item>
              <Descriptions.Item label="附件预览" span={2}>
                {currentRow.attachmentUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <PaperClipOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <span style={{ flex: 1, marginRight: 16, overflow: 'hidden', textOverflow: 'ellipsis' }}>{getFileName(currentRow.attachmentUrl)}</span>
                    <Button type="primary" size="small" onClick={() => handleFilePreview(currentRow.attachmentUrl)}>预览文件</Button>
                  </div>
                ) : <span style={{ color: '#ccc' }}>未上传扫描件</span>}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </Card>
  );
};

export default ContractIndex;