import React, { useState, useEffect } from 'react';
import { 
  Card, Descriptions, Tag, Button, Space, Typography, 
  Divider, Skeleton, Empty, Result, Tabs, Table 
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, ApartmentOutlined, 
  FileDoneOutlined, HistoryOutlined 
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Title, Paragraph } = Typography;

const CertificationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // 获取详情数据
  const fetchDetail = async () => {
    setLoading(true);
    try {
      // 这里的接口路径请根据你的后端调整，通常是 /certification/types/:id
      const res: any = await request.get(`/certification/types/${id}`);
      setData(res?.data || null);
    } catch (e) {
      console.error('获取详情失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('当前获取到的通知ID:', id);
    if (id) fetchDetail();
  }, [id]);

  if (!loading && !data) {
    return (
      <Result
        status="404"
        title="数据不存在"
        subTitle="抱歉，该认证类型可能已被删除或路径错误。"
        extra={<Button type="primary" onClick={() => navigate('/system/certification')}>返回列表</Button>}
      />
    );
  }

  const tabItems = [
    {
      key: 'basic',
      label: (<span><ApartmentOutlined />基本属性</span>),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="认证名称" span={2}>
              <Text style={{ fontWeight: 'bold', fontSize: '16px' }}>{data?.type_name}</Text>
              <Tag color="cyan" style={{ marginLeft: 8 }}>{data?.type_code}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所属大类">{data?.parent_name}</Descriptions.Item>
            <Descriptions.Item label="大类代码">{data?.parent_code}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={data?.is_active === 1 ? 'success' : 'error'}>
                {data?.is_active === 1 ? '启用中' : '已禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="排序权重">{data?.sort}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(data?.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="最后更新">{dayjs(data?.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="项目描述" span={2}>
              <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}>
                {data?.description || '暂无详细描述信息'}
              </Paragraph>
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'contracts',
      label: (<span><FileDoneOutlined />关联合同统计</span>),
      children: (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Empty description="该认证类型下的合同列表功能开发中..." />
        </div>
      ),
    },
    {
      key: 'logs',
      label: (<span><HistoryOutlined />操作日志</span>),
      children: (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Empty description="暂无修改日志记录" />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '4px' }}>
      <Card
        loading={loading}
        title={
          <Space>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/system/certification')} 
            />
            <span>认证项详细资料</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<EditOutlined />}>
            编辑此项
          </Button>
        }
      >
        <Skeleton loading={loading} active>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
            <div className="detail-icon-box" style={{ 
              width: 48, height: 48, borderRadius: 12, 
              background: '#f0fdfa', color: '#71ccbc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 16, fontSize: 24
            }}>
              <ApartmentOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>{data?.type_name}</Title>
              <Typography.Text type="secondary">{data?.parent_name} · {data?.type_code}</Typography.Text>
            </div>
          </div>

          <Tabs defaultActiveKey="basic" items={tabItems} />
        </Skeleton>
      </Card>
    </div>
  );
};

const { Text } = Typography;

export default CertificationDetail;