import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Divider, 
  Button, 
  Space, 
  Skeleton, 
  Empty, 
  message, 
  Tag, 
  Breadcrumb 
} from 'antd';
import { 
  LikeOutlined, 
  LikeFilled, 
  FileTextOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  ArrowLeftOutlined,
  HomeOutlined
} from '@ant-design/icons';
import request from '../../../../utils/request';
import './index.less';

const { Title, Text } = Typography;

const NotificationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 获取通知类型标签
  const renderTypeTag = (type: number) => {
    const config: any = {
      1: { color: 'blue', text: '系统公告' },
      2: { color: 'orange', text: '任务提醒' },
      3: { color: 'magenta', text: '活动通知' },
    };
    const target = config[type] || config[1];
    return <Tag color={target.color}>{target.text}</Tag>;
  };

  useEffect(() => {
    if (id) {
      fetchDetail(parseInt(id));
    }
  }, [id]);

  const fetchDetail = async (noticeId: number) => {
  try {
    setLoading(true);
    const res = await request(`/notifications/detail/${noticeId}`, { method: 'GET' });
    if (res) {
      // 💡 适配不同的接口返回格式
      const finalData = res.data || res; 
      setData(finalData);
      setLikeCount(finalData.likeCount ?? 0);
    }
  } catch (error: any) {
    message.error('获取通知详情失败');
  } finally {
    setLoading(false);
  }
};

  const handleLike = async () => {
    try {
      const nextLikedState = !isLiked;
      // 💡 对应你 NotificationsService 中的 toggleLike 接口
      const res = await request(`/notifications/like/${id}`, {
        method: 'POST',
        data: { isLike: nextLikedState }
      });
      
      setIsLiked(nextLikedState);
      setLikeCount(nextLikedState ? likeCount + 1 : likeCount - 1);
      message.success(nextLikedState ? '点赞成功' : '已取消点赞');
    } catch (error) {
      message.error('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="notice-detail-container">
        <Card bordered={false}>
          <Skeleton active avatar={{ size: 'large' }} paragraph={{ rows: 12 }} />
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="notice-detail-container">
        <Empty description="通知内容不存在或已被撤回" />
      </div>
    );
  }

  return (
    <div className="notice-detail-container">
      {/* 顶部面包屑/返回导航 */}
      <div className="detail-header-nav">
        <Breadcrumb items={[
          { title: <><HomeOutlined /> 首页</>, href: '/' },
          { title: '通知公告' },
          { title: '正文' }
        ]} />
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ paddingLeft: 0, marginTop: 10 }}
        >
          返回列表
        </Button>
      </div>

      <Card bordered={false} className="notice-article-card">
        {/* 文章头部 */}
        <header className="article-header">
          <Title level={2}>{data.title}</Title>
          <div className="article-meta">
            <Space size="middle">
              {renderTypeTag(data.type)}
              <Text type="secondary"><ClockCircleOutlined /> 发布于：{data.createTime}</Text>
              <Text type="secondary"><EyeOutlined /> {data.viewCount} 次浏览</Text>
            </Space>
          </div>
        </header>

        <Divider />

        {/* 文章正文 */}
        <article className="article-content">
          <div 
            className="rich-text-body"
            dangerouslySetInnerHTML={{ __html: data.content }} 
          />
        </article>

        {/* 附件区域 */}
        {data.attachments && data.attachments.length > 0 && (
          <div className="article-attachments">
            <Divider>附件资料</Divider>
            <div className="file-list">
              {data.attachments.map((file: any, index: number) => (
                <div key={index} className="file-card">
                  <FileTextOutlined className="file-icon" />
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <Button type="link" size="small" href={file.url} target="_blank" download>
                      点击下载
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Divider />

        {/* 底部交互 */}
        <footer className="article-footer">
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <Button 
              type={isLiked ? 'primary' : 'default'} 
              shape="round" 
              size="large"
              icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
              onClick={handleLike}
              className={isLiked ? 'like-btn active' : 'like-btn'}
            >
              点赞 {likeCount}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              如果您觉得内容有帮助，请点个赞吧
            </Text>
          </Space>
        </footer>
      </Card>
    </div>
  );
};

export default NotificationDetail;