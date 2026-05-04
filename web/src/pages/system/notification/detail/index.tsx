/**
 * @file web/src/pages/system/notification/detail/index.tsx
 * @version 2.0.0 [2026-05-04]
 * @desc 修复：
 *   1. 返回按钮根据 from 参数决定跳转目标（dashboard / 管理列表）
 *   2. 进入详情页时查询当前用户是否已点赞，正确初始化按钮状态
 *   3. 点赞接口不再传 isLike，改为服务端 toggle 逻辑
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Typography, Divider, Button, Space,
  Skeleton, Empty, message, Tag, Breadcrumb,
} from 'antd';
import {
  LikeOutlined, LikeFilled, FileTextOutlined,
  EyeOutlined, ClockCircleOutlined,
  ArrowLeftOutlined, HomeOutlined,
} from '@ant-design/icons';
import request from '../../../../utils/request';
import { getNotificationDetail } from '../../../../services/notification';
import '@wangeditor/editor/dist/css/style.css';
import './index.less';

const { Title, Text } = Typography;

const NotificationDetail: React.FC = () => {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState<any>(null);
  const [isLiked, setIsLiked]   = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking]     = useState(false);

  // ✅ 判断来源：URL 带 ?from=dashboard 则返回看板，否则返回管理列表
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from'); // 'dashboard' | null

  const handleBack = () => {
    if (from === 'dashboard') {
      navigate('/dashboard');
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/system/notification');
    }
  };

  const renderTypeTag = (type: number) => {
    const config: any = {
      1: { color: 'blue',    text: '系统公告' },
      2: { color: 'orange',  text: '任务提醒' },
      3: { color: 'magenta', text: '活动通知' },
    };
    const t = config[type] || config[1];
    return <Tag color={t.color}>{t.text}</Tag>;
  };

  useEffect(() => {
    if (id) {
      fetchDetail(parseInt(id));
      fetchLikeStatus(parseInt(id));
    }
  }, [id]);

  const fetchDetail = async (noticeId: number) => {
  try {
    setLoading(true);
    const res: any = await getNotificationDetail(noticeId);
    // @/utils/request 返回完整 AxiosResponse，业务数据在 res.data
    const body = res?.data;                    // { code, data, message }
    const noticeData = body?.data ?? body;     // 兼容直接返回对象的情况
    if (noticeData && body?.code === 200) {
      setData(noticeData);
      setLikeCount(noticeData.likeCount ?? 0);
    } else {
      message.error(body?.message || '获取通知详情失败');
    }
  } catch {
    message.error('获取通知详情失败');
  } finally {
    setLoading(false);
  }
};

  // ✅ 初始化点赞状态：查询当前用户是否已点赞
  const fetchLikeStatus = async (noticeId: number) => {
  try {
    const res: any = await request.get(`/notifications/${noticeId}/like-status`);
    // res.data = { code: 200, data: { liked: true/false } }
    if (res?.data?.data?.liked !== undefined) {
      setIsLiked(res.data.data.liked);
    }
  } catch {}
};

  // ✅ 点赞：服务端 toggle，不传 isLike 参数
  const handleLike = async () => {
  if (liking) return;
  setLiking(true);
  try {
    const res: any = await request.post(`/notifications/like/${id}`);
    // res.data = { code: 200, data: { liked, count } }
    if (res?.data?.code === 200) {
      setIsLiked(res.data.data.liked);
      setLikeCount(res.data.data.count);
      message.success(res.data.data.liked ? '点赞成功' : '已取消点赞');
    }
  } catch {
    message.error('操作失败');
  } finally {
    setLiking(false);
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
          { title: <><HomeOutlined /> 首页</>, onClick: () => navigate('/dashboard') },
          { title: from === 'dashboard' ? '业务看板' : '通知管理' },
          { title: '正文' },
        ]} />
        {/* ✅ 返回按钮根据来源动态显示文案和目标 */}
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ paddingLeft: 0, marginTop: 10 }}
        >
          {from === 'dashboard' ? '返回看板' : '返回列表'}
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

        <article className="article-content">
          <div
            className="editor-content-view"
            style={{ backgroundColor: '#fff', padding: '0 10px', overflowWrap: 'break-word' }}
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
              loading={liking}
              icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
              onClick={handleLike}
              className={isLiked ? 'like-btn active' : 'like-btn'}
              style={{ height: 46, padding: '0 30px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {isLiked ? '已点赞' : '点赞'} {likeCount}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              如果您觉得内容有帮助，请点个赞吧
            </Text>
          </Space>
        </footer>
      </Card>

      <style>{`
        .editor-content-view p { margin: 1em 0; }
        .editor-content-view p[style*="text-align: center"] { text-align: center !important; }
        .editor-content-view img { max-width: 100%; display: inline-block; height: auto; vertical-align: middle; }
      `}</style>
    </div>
  );
};

export default NotificationDetail;