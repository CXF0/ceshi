/**
 * @file web/src/pages/certificates/components/CertificateModal.tsx
 * @version 2.1.0 [2026-04-28]
 * @desc 修复：
 *  1. 编辑时认证类型（Cascader）正确回填：从 category_id 反查 [parent_code, type_code]
 *  2. 去掉状态字段（status 由后端根据 expiry_date 自动计算，不在前端手动设置）
 */
import React, { useEffect, useState } from 'react';
import {
  Modal, Form, Input, DatePicker, Select, message,
  Row, Col, Upload, Button, Cascader,
} from 'antd';
import { UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';
import { CrmCustomerApi } from '@/services/crm';

const createId = () =>
  (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface Props {
  open: boolean;
  initialValues?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

// 认证类型数据结构
interface CertOption {
  value: string;
  label: string;
  children: { value: string; label: string }[];
}

const CertificateModal: React.FC<Props> = ({ open, initialValues, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading]                 = useState(false);
  const [certOptions, setCertOptions]         = useState<CertOption[]>([]);
  // 两个映射表：用于回填和提交
  const [typeCodeToId, setTypeCodeToId]       = useState<Record<string, number>>({}); // type_code → id
  const [idToPath, setIdToPath]               = useState<Record<number, string[]>>({});  // id → [parent_code, type_code]
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: string }[]>([]);
  const [fileUrl, setFileUrl]                 = useState('');
  const [uploading, setUploading]             = useState(false);

  const isEdit = !!initialValues?.id;

  // ── 加载认证类型 ─────────────────────────────────────
  const loadCertTypes = async () => {
    try {
      const res: any = await request.get('/cert-types');
      const list: any[] = res?.data?.data || res?.data || [];

      const parentMap: Record<string, CertOption> = {};
      const idPathMap: Record<number, string[]>   = {};
      const codeIdMap: Record<string, number>     = {};

      list.forEach((item: any) => {
        if (!parentMap[item.parent_code]) {
          parentMap[item.parent_code] = {
            value: item.parent_code,
            label: item.parent_name,
            children: [],
          };
        }
        parentMap[item.parent_code].children.push({
          value: item.type_code,
          label: item.type_name,
        });
        // 建立 id ↔ [parent_code, type_code] 的映射
        idPathMap[item.id]        = [item.parent_code, item.type_code];
        codeIdMap[item.type_code] = item.id;
      });

      setCertOptions(Object.values(parentMap));
      setIdToPath(idPathMap);
      setTypeCodeToId(codeIdMap);
    } catch { console.error('认证类型加载失败'); }
  };

  // ── 搜索客户 ─────────────────────────────────────────
  const handleSearchCustomer = async (name?: string) => {
    try {
      const res: any = await CrmCustomerApi.findAll({ name: name || undefined, pageSize: 50, page: 1, status: 1 });
      const items = res?.data?.items || res?.data?.data?.items || [];
      setCustomerOptions(items.map((i: any) => ({ label: i.name, value: String(i.id) })));
    } catch {}
  };

  // ── 弹窗打开时初始化 ─────────────────────────────────
  useEffect(() => {
    if (!open) return;

    // 先加载基础数据
    Promise.all([loadCertTypes(), handleSearchCustomer()]).then(() => {
      if (isEdit && initialValues) {
        setFileUrl(initialValues.file_url || '');
      } else {
        form.resetFields();
        setFileUrl('');
      }
    });
  }, [open]);

  // ── 编辑回填：等 certOptions 和 idToPath 都加载完再 setFieldsValue ──
  useEffect(() => {
    if (!open || !isEdit || !initialValues || Object.keys(idToPath).length === 0) return;

    const cascaderValue = idToPath[initialValues.category_id] || [];

    // 确保客户选项里有当前客户
    if (initialValues.customer?.name && initialValues.customer_id) {
      setCustomerOptions(prev => {
        const exists = prev.some(o => o.value === String(initialValues.customer_id));
        if (exists) return prev;
        return [{ label: initialValues.customer.name, value: String(initialValues.customer_id) }, ...prev];
      });
    }

    form.setFieldsValue({
      certificate_number: initialValues.certificate_number,
      customer_id:        String(initialValues.customer_id || ''),
      issuer:             initialValues.issuer,
      issue_date:         initialValues.issue_date  ? dayjs(initialValues.issue_date)  : null,
      expiry_date:        initialValues.expiry_date ? dayjs(initialValues.expiry_date) : null,
      category_cascader:  cascaderValue,  // ✅ 正确回填 [parent_code, type_code]
    });
  }, [idToPath, open, isEdit, initialValues]);

  // ── 附件上传 ─────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await request.post('/common/upload/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.data?.url || res?.data?.url || res?.data;
      setFileUrl(url);
      form.setFieldValue('file_url', url);
      message.success('附件上传成功');
    } catch { message.error('上传失败'); }
    finally { setUploading(false); }
    return false;
  };

  // ── 提交 ─────────────────────────────────────────────
  const handleOk = async () => {
    let values: any;
    try { values = await form.validateFields(); } catch { return; }

    setLoading(true);
    try {
      const typeCode   = values.category_cascader?.[values.category_cascader.length - 1];
      const categoryId = typeCodeToId[typeCode];

      // ✅ 不传 status，由后端自动计算
      const payload: any = {
        certificate_number: values.certificate_number,
        customer_id:        values.customer_id,
        category_id:        categoryId,
        issuer:             values.issuer || null,
        issue_date:         values.issue_date?.format('YYYY-MM-DD')  || null,
        expiry_date:        values.expiry_date?.format('YYYY-MM-DD') || null,
        file_url:           fileUrl || null,
      };

      if (isEdit) {
        await request.put(`/certificates/${initialValues.id}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/certificates', { ...payload, id: createId() });
        message.success('录入成功');
      }
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑证书信息' : '新证书录入'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={660}
      destroyOnClose
      okText="确认保存"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>

        <Form.Item name="customer_id" label="认证主体（客户）"
          rules={[{ required: true, message: '请选择认证主体' }]}>
          <Select showSearch placeholder="搜索并选择客户" filterOption={false}
            onSearch={handleSearchCustomer} options={customerOptions}
            notFoundContent="未找到客户，请先在客户管理中录入" />
        </Form.Item>

        <Form.Item name="category_cascader" label="认证类型"
          rules={[{ required: true, message: '请选择认证类型' }]}>
          <Cascader
            options={certOptions}
            placeholder="请先选择认证体系大类，再选具体项目"
            expandTrigger="hover"
            style={{ width: '100%' }}
            showSearch
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="certificate_number" label="证书编号"
              rules={[{ required: true, message: '请输入证书编号' }]}>
              <Input placeholder="如：ZD-ISO-2026-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="issuer" label="颁发机构">
              <Input placeholder="颁发该证书的机构全称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="issue_date" label="颁发日期"
              rules={[{ required: true, message: '请选择颁发日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="选择颁发日期" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="expiry_date"
              label={
                <span>
                  到期日期
                  <span style={{ marginLeft: 6, fontSize: 11, color: '#8c8c8c', fontWeight: 400 }}>
                    （保存后状态自动更新）
                  </span>
                </span>
              }
              rules={[
                { required: true, message: '请选择到期日期' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || !getFieldValue('issue_date')) return Promise.resolve();
                    if (value.isAfter(getFieldValue('issue_date'))) return Promise.resolve();
                    return Promise.reject(new Error('到期日期必须晚于颁发日期'));
                  },
                }),
              ]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="选择到期日期" />
            </Form.Item>
          </Col>
        </Row>

        {/* ✅ 去掉状态字段，改为说明文字 */}
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: '#f0faf8', border: '1px solid #71ccbc30',
          fontSize: 12, color: '#52c41a', marginBottom: 16,
        }}>
          💡 证书状态（有效 / 即将到期 / 已过期）将根据到期日期自动计算，每日凌晨 0:01 统一更新，无需手动设置。
        </div>

        <Form.Item name="file_url" label="证书附件">
          <Upload showUploadList={false} beforeUpload={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
            <Button icon={<UploadOutlined />} loading={uploading} style={{ width: '100%' }}>
              {fileUrl ? '重新上传' : '上传证书文件'}
            </Button>
          </Upload>
          {fileUrl && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <PaperClipOutlined />
              <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: '#52c41a' }}>
                {fileUrl.split('/').pop()}
              </a>
            </div>
          )}
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default CertificateModal;
