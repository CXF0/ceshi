import React, { memo, useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Avatar, Button, Space, Divider, Badge, message } from 'antd';
import { UserOutlined, RocketOutlined, FileAddOutlined, BellOutlined, RightOutlined } from '@ant-design/icons';
import request from '../../../utils/request'; // 确保路径正确
import { getNotifications } from '../../../services/notification';
const { Title, Text } = Typography;

const GlobalOverview: React.FC<{ user: any }> = memo(({ user }) => {
  const [latestNotice, setLatestNotice] = useState<any>(null);

  // 1. 获取最新公告数据
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        // 建议：直接调用你已经跑通的 service 函数
        const res = await getNotifications({ status: 1 });
        console.log('首页获取公告原始响应:', res);

        // 💡 适配逻辑：根据你 request.ts 的封装情况自动识别
        const list = Array.isArray(res) ? res : res?.data;

        if (list && list.length > 0) {
          console.log('成功提取到公告列表:', list);
          setLatestNotice(list[0]);
        } else {
          console.warn('接口通了，但列表是空的');
        }
      } catch (error) {
        console.error('看板获取公告失败:', error);
      }
    };
    fetchNotice();
  }, []);

  // 跳转详情页逻辑
  const goToDetail = () => {
    if (latestNotice?.id) {
      window.open(`/#/system/notification/detail/${latestNotice.id}`, '_blank');
    } else {
      message.info('暂无最新系统通知');
    }
  };

  // 💡 部门映射表
  const deptMap: Record<number, string> = {
    1: '寻梦控股昆明分公司',
    2: '寻梦认证成都分公司',
    3: '寻梦控股总公司',
    4: '寻梦认证杭州分公司',
    5: '寻梦控股宣城总公司',
  };

  // 💡 角色映射表
  const roleMap: Record<string, string> = {
    admin: '超级管理员',
    sales: '销售主管',
    consultant: '咨询顾问',
  };

  const getTimeState = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早安';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
      <Row align="middle" gutter={24}>
        <Col flex="64px">
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#71ccbc' }} />
        </Col>
        <Col flex="auto">
          <Title level={4} style={{ marginBottom: 4, fontWeight: 500 }}>
            {getTimeState()}，{user?.nickname || '同事'}。祝你开心每一天！
          </Title>
          <Space split={<Divider type="vertical" />} style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
            <Badge status="processing" color="#71ccbc" text={roleMap[user?.roleKey] || '职员'} />
            <span>{deptMap[user?.deptId] || '寻梦控股'}</span>
          </Space>
        </Col>
        <Col>
          <Space size={48}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>项目总数</Text>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'rgba(0, 0, 0, 0.85)' }}>56</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>待办任务</Text>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#ff4d4f' }}>8</div>
            </div>
          </Space>
        </Col>
      </Row>
      
      <Divider style={{ margin: '16px 0' }} />
      
      <Row justify="space-between" align="middle">
        <Col>
          <Space size="middle">
            <Text strong style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              <RocketOutlined style={{ marginRight: 4 }} /> 快捷入口：
            </Text>
            <Button size="small" type="dashed" icon={<FileAddOutlined />}>新增合同</Button>
            <Button size="small" type="dashed">客户录入</Button>
            <Button size="small" type="dashed">进度填报</Button>
          </Space>
        </Col>
        <Col>
          {/* 💡 这里改为动态对接真实公告 */}
          <Badge dot={!!latestNotice} offset={[-2, 2]}>
            <Text 
              type="secondary" 
              style={{ fontSize: '12px', cursor: 'pointer', transition: 'all 0.3s' }}
              className="notice-link-hover"
              onClick={goToDetail}
            >
              <BellOutlined /> 系统通知：
              {latestNotice ? (
                <span style={{ color: '#1890ff' }}>
                  {latestNotice.title} 
                  <Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>
                    {latestNotice.createTime?.split(' ')[0]} <RightOutlined style={{ fontSize: 8 }} />
                  </Text>
                </span>
              ) : (
                '暂无最新通知'
              )}
            </Text>
          </Badge>
        </Col>
      </Row>

      {/* 简单的鼠标悬停样式 */}
      <style>{`
        .notice-link-hover:hover {
          color: #1890ff !important;
          opacity: 0.8;
        }
      `}</style>
    </Card>
  );
});

export default GlobalOverview;