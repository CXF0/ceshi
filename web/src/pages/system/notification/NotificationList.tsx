/**
 * @file web/src/pages/system/notification/NotificationList.tsx
 * @version 2.1.0 [2026-05-04]
 * @desc 修复：对齐 @/utils/request 返回结构（res.data.code / res.data.data）
 */
import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Space, Tag, Modal, Form, Input, Select, message, Badge } from 'antd';
import {
  PlusOutlined, SearchOutlined,
  DeleteOutlined, EditOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getNotifications, deleteNotification, updateNotificationStatus } from '@/services/notification';

const { Option } = Select;

const NotificationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<any[]>([]);
  const [queryForm]           = Form.useForm();
  const navigate              = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const values = queryForm.getFieldsValue();
      const res: any = await getNotifications(values);
      // @/utils/request 返回完整 AxiosResponse：res.data = { code, data, message }
      const body = res?.data;
      if (body?.code === 200) {
        setData(Array.isArray(body.data) ? body.data : []);
      } else {
        message.error(body?.message || '加载列表失败');
      }
    } catch {
      message.error('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const statusConfig: Record<number, { text: string; badge: any }> = {
    0: { text: '草稿',   badge: 'default' },
    1: { text: '已发布', badge: 'success' },
    2: { text: '已撤回', badge: 'warning' },
  };

  const typeConfig: Record<number, { text: string; color: string }> = {
    1: { text: '公告', color: 'blue'   },
    2: { text: '提醒', color: 'cyan'   },
    3: { text: '活动', color: 'purple' },
  };

  const handleStatusChange = async (id: number, status: number) => {
    try {
      const res: any = await updateNotificationStatus(id, status);
      if (res?.data?.code === 200) {
        message.success('操作成功');
        loadData();
      } else {
        message.error(res?.data?.message || '状态更新失败');
      }
    } catch {
      message.error('状态更新失败');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后数据无法恢复',
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const res: any = await deleteNotification(id);
          if (res?.data?.code === 200) {
            message.success('删除成功');
            loadData();
          } else {
            message.error(res?.data?.message || '删除失败');
          }
        } catch {
          message.error('删除失败');
        }
      },
    });
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
      width: 90,
      render: (type: number) => (
        <Tag color={typeConfig[type]?.color}>{typeConfig[type]?.text}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: number) => (
        <Badge status={statusConfig[status]?.badge} text={statusConfig[status]?.text} />
      ),
    },
    {
      title: '数据统计',
      width: 130,
      render: (_: any, record: any) => (
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
          阅 {record.viewCount || 0}
          <span style={{ marginLeft: 8 }}>赞 {record.likeCount || 0}</span>
        </span>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: any, record: any) => (
        <Space size={0}>
          <Button
            type="link" size="small" icon={<EyeOutlined />}
            onClick={() => navigate(`/system/notification/detail/${record.id}`)}
          >详情</Button>

          {record.status !== 1 && (
            <Button
              type="link" size="small" icon={<EditOutlined />}
              onClick={() => navigate(`/system/notification/create?id=${record.id}`)}
            >编辑</Button>
          )}

          {record.status === 1 ? (
            <Button type="link" size="small" danger
              onClick={() => handleStatusChange(record.id, 2)}>撤回</Button>
          ) : (
            <Button type="link" size="small" style={{ color: '#52c41a' }}
              onClick={() => handleStatusChange(record.id, 1)}>发布</Button>
          )}

          <Button type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} title="通知公告管理">
        <Form form={queryForm} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item name="title">
            <Input placeholder="搜索标题" allowClear onPressEnter={loadData} />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="全部状态" allowClear style={{ width: 120 }} onChange={loadData}>
              <Option value={0}>草稿</Option>
              <Option value={1}>已发布</Option>
              <Option value={2}>已撤回</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>查询</Button>
          </Form.Item>
          <Button
            type="primary" icon={<PlusOutlined />}
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
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default NotificationList;