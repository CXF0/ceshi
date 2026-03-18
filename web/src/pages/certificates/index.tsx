import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileImageOutlined } from '@ant-design/icons';
import { getCertificates, deleteCertificate } from '@/services/certificate';
import CertificateModal from './components/CertificateModal';
import moment from 'moment';

const CertificateList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getCertificates();
      if (res.data?.code === 200) setData(res.data.data);
    } catch (err) {
      message.error('加载列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const statusMap: any = {
    valid: { color: 'green', text: '有效' },
    expiring: { color: 'orange', text: '即将到期' },
    expired: { color: 'red', text: '已过期' },
    revoked: { color: 'default', text: '已撤销' },
  };

  const columns = [
    {
      title: '证书编号',
      dataIndex: 'certificate_number',
      copyable: true,
    },
    {
      title: '认证类型',
      dataIndex: ['category', 'name'], // 💡 自动取关联表的 name 字段
      render: (text: string) => <Tag color="blue">{text || '未知类型'}</Tag>,
    },
    {
      title: '有效期',
      key: 'date_range',
      render: (record: any) => (
        <span style={{ fontSize: '12px' }}>
          {record.issue_date} 至 {record.expiry_date}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      ),
    },
    {
      title: '证书附件',
      dataIndex: 'file_url',
      render: (url: string) => url ? (
        <Tooltip title="查看图片">
          <Button type="link" icon={<FileImageOutlined />} onClick={() => window.open(url)} />
        </Tooltip>
      ) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: any) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingRecord(record);
              setIsModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确定删除该证书记录？',
      content: '删除后关联的文件记录也将失效',
      okText: '确定',
      okType: 'danger',
      onOk: async () => {
        await deleteCertificate(id);
        message.success('删除成功');
        fetchList();
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="证书台账管理" 
        bordered={false}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}>
            录入证书
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{ showTotal: (total) => `共 ${total} 项` }}
        />
      </Card>

      <CertificateModal 
        open={isModalOpen} 
        initialValues={editingRecord}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchList();
        }}
      />
    </div>
  );
};

export default CertificateList;