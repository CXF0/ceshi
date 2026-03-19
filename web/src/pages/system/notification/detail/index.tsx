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
import { getNotificationDetail } from '../../../../services/notification';
// 💡 1. 必须引入样式，否则居中、表格、列表等样式都会失效
import '@wangeditor/editor/dist/css/style.css'; 
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
      const res = await getNotificationDetail(noticeId);
      
      // 兼容两种数据结构：res.data 或 res 直接是对象
      const noticeData = res?.data || res;
      
      if (noticeData && (res.code === 200 || !res.code)) {
        setData(noticeData);
        setLikeCount(noticeData.likeCount ?? 0);
      } else {
        message.error(res?.message || '获取通知详情失败');
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      message.error('获取通知详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const nextLikedState = !isLiked;
      
      const res: any = await request(`/notifications/like/${id}`, {
        method: 'POST',
        data: { isLike: nextLikedState }
      });
      
      // 兼容 NestJS 默认的 201 状态码
      if (res && (res.code === 200 || res.statusCode === 201 || res.data)) {
        const serverCount = res.data?.count;
        
        if (typeof serverCount === 'number') {
          setLikeCount(serverCount);
        } else {
          setLikeCount(prev => nextLikedState ? prev + 1 : Math.max(0, prev - 1));
        }
        
        setIsLiked(nextLikedState);
        message.success(nextLikedState ? '点赞成功' : '已取消点赞');
      }
    } catch (error) {
      console.error('点赞失败:', error);
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
      <div className="detail-header-nav">
        <Breadcrumb items={[
          { title: <><HomeOutlined /> 首页</>, onClick: () => navigate('/') },
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
        <header className="article-header">
          <Title level={2}>{data.title}</Title>
          <div className="article-meta">
            <Space size="middle">
              {renderTypeTag(data.type)}
              <Text type="secondary"><ClockCircleOutlined /> 发布于：{new Date(data.createTime).toLocaleString()}</Text>
              <Text type="secondary"><EyeOutlined /> {data.viewCount} 次浏览</Text>
            </Space>
          </div>
        </header>

        <Divider />

        {/* 💡 2. 这里的 className 和内联补丁是解决居中的关键 */}
        <article className="article-content">
          <div 
            className="editor-content-view" 
            style={{ 
              backgroundColor: '#fff', 
              padding: '0 10px',
              overflowWrap: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: data.content }} 
          />
        </article>

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

        <footer className="article-footer">
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <Button 
              type={isLiked ? 'primary' : 'default'} 
              shape="round" 
              size="large"
              icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
              onClick={handleLike}
              className={isLiked ? 'like-btn active' : 'like-btn'}
              style={{ 
                height: '46px', 
                padding: '0 30px', 
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              点赞 {likeCount}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              如果您觉得内容有帮助，请点个赞吧
            </Text>
          </Space>
        </footer>
      </Card>

      {/* 💡 3. CSS 补丁强制修正图片居中逻辑 */}
      <style>{`
        .editor-content-view p {
          margin: 1em 0;
        }
        /* 强制让设置了居中的 P 标签内部元素居中 */
        .editor-content-view p[style*="text-align: center"] {
          text-align: center !important;
        }
        /* 确保图片是行内块，从而受父级 text-align 控制 */
        .editor-content-view img {
          max-width: 100%;
          display: inline-block; 
          height: auto;
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

export default NotificationDetail;