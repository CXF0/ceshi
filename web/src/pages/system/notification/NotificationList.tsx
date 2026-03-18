import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Space, Tag, Modal, Form, Input, Select, message, Badge } from 'antd';
import { 
  PlusOutlined, SearchOutlined, 
  DeleteOutlined, EditOutlined, EyeOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
// ✅ 引入正确的查询接口
import { getNotifications, deleteNotification, updateNotificationStatus } from '@/services/notification';

const { Option } = Select;

const NotificationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [queryForm] = Form.useForm();
  const navigate = useNavigate();

  // ✅ 核心修复：将 saveNotification 改为 getNotifications
  const loadData = async () => {
    setLoading(true);
    try {
      // 获取搜索表单的值
      const values = queryForm.getFieldsValue();
      // 使用 GET 接口进行查询
      const res = await getNotifications(values);
      
      if (res.code === 200) {
        setData(res.data);
      } else {
        message.error(res.message || '加载列表失败');
      }
    } catch (err) {
      console.error('加载列表错误:', err);
      message.error('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statusConfig: any = {
    0: { text: '草稿', badge: 'default' },
    1: { text: '已发布', badge: 'success' },
    2: { text: '已撤回', badge: 'warning' },
  };

  const typeConfig: any = {
    1: { text: '公告', color: 'blue' },
    2: { text: '提醒', color: 'cyan' },
    3: { text: '活动', color: 'purple' },
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (text: string, record: any) => (
        <Space>
          {record.priority > 0 && <Tag color="red">置顶</Tag>}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type: number) => <Tag color={typeConfig[type]?.color}>{typeConfig[type]?.text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: number) => (
        <Badge status={statusConfig[status]?.badge} text={statusConfig[status]?.text} />
      ),
    },
    {
      title: '数据统计',
      width: 150,
      render: (record: any) => (
        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
          <span>阅 {record.viewCount || 0}</span>
          <span style={{ marginLeft: 8 }}>赞 {record.likeCount || 0}</span>
        </div>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      width: 170,
      render: (time: string) => time ? moment(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (record: any) => (
        <Space size={0}>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/system/notification/detail/${record.id}`)}
          >
            详情
          </Button>

          {record.status !== 1 && (
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/system/notification/create?id=${record.id}`)}
            >
              编辑
            </Button>
          )}

          {record.status === 1 ? (
            <Button type="link" size="small" danger onClick={() => handleStatusChange(record.id, 2)}>撤回</Button>
          ) : (
            <Button type="link" size="small" style={{ color: '#52c41a' }} onClick={() => handleStatusChange(record.id, 1)}>发布</Button>
          )}

          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const handleStatusChange = async (id: number, status: number) => {
    try {
      const res = await updateNotificationStatus(id, status);
      if (res.code === 200) {
        message.success('操作成功');
        loadData();
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后数据无法恢复',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await deleteNotification(id);
          if (res.code === 200) {
            message.success('删除成功');
            loadData();
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  return (
    <div>
      <Card bordered={false} title="通知公告管理">
        <Form form={queryForm} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item name="title" label="标题">
            <Input placeholder="搜索标题" allowClear onPressEnter={loadData} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }} onChange={loadData}>
              <Option value={0}>草稿</Option>
              <Option value={1}>已发布</Option>
              <Option value={2}>已撤回</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>
              查询
            </Button>
          </Form.Item>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ marginLeft: 'auto' }} 
            onClick={() => navigate('/system/notification/create')}
          >
            新建公告
          </Button>
        </Form>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
        />
      </Card>
    </div>
  );
};

export default NotificationList;