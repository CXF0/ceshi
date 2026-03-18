import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, message, Row, Col } from 'antd';
import moment from 'moment';
import { saveCertificate } from '@/services/certificate';
import { getCertTypes } from '@/services/cert-type'; // ✅ 跨服务引用类型列表

interface Props {
  open: boolean;
  initialValues?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const CertificateModal: React.FC<Props> = ({ open, initialValues, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [typeList, setTypeList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // 1. 加载认证类型下拉框
      getCertTypes().then((res: { data: any; }) => setTypeList(res.data || []));

      // 2. 如果是编辑，处理日期格式
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          issue_date: initialValues.issue_date ? moment(initialValues.issue_date) : null,
          expiry_date: initialValues.expiry_date ? moment(initialValues.expiry_date) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 💡 提交前将 moment 对象转回后台需要的字符串格式
      const params = {
        ...values,
        id: initialValues?.id, // UUID
        issue_date: values.issue_date.format('YYYY-MM-DD'),
        expiry_date: values.expiry_date.format('YYYY-MM-DD'),
      };

      const res = await saveCertificate(params);
      if (res.data?.code === 200) {
        message.success('保存成功');
        onSuccess();
      }
    } catch (err) {
      console.error('Validate Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialValues ? '编辑证书信息' : '新证书录入'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="certificate_number" label="证书编号" rules={[{ required: true, message: '请输入编号' }]}>
              <Input placeholder="例如: ZD-2026-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="category_id" label="认证类型" rules={[{ required: true, message: '请选择类型' }]}>
              <Select placeholder="请选择认证类型">
                {typeList.map((t: any) => (
                  <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="issuer" label="颁发机构">
          <Input placeholder="请输入颁发机构全称" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="issue_date" label="颁发日期" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="expiry_date" label="到期日期" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="status" label="证书状态" initialValue="valid">
          <Select>
            <Select.Option value="valid">有效</Select.Option>
            <Select.Option value="revoked">已撤销</Select.Option>
            <Select.Option value="expired">已过期</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="file_url" label="证书图片地址">
          <Input placeholder="请输入图片URL或上传后的地址" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CertificateModal;