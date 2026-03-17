import React from 'react';
import { Card, Row, Col, Typography, Avatar, Button, Space, Divider, Badge } from 'antd';
import { UserOutlined, RocketOutlined, FileAddOutlined, BellOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const GlobalOverview: React.FC<{ user: any }> = ({ user }) => {
  return (
    <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
      <Row align="middle" gutter={24}>
        <Col flex="64px">
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
        </Col>
        <Col flex="auto">
          <Title level={4} style={{ marginBottom: 4 }}>
            早安，{user.name}。祝你开心每一天！
          </Title>
          <Text type="secondary">
            {user.roleName} | {user.deptName || '业务部'}
          </Text>
        </Col>
        <Col>
          <Space size="large">
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">项目总数</Text>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>56</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">待办任务</Text>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>8</div>
            </div>
          </Space>
        </Col>
      </Row>
      
      <Divider style={{ margin: '16px 0' }} />
      
      <Row justify="space-between" align="middle">
        <Col>
          <Space size="middle">
            <Text strong><RocketOutlined /> 快捷入口：</Text>
            <Button size="small" type="dashed" icon={<FileAddOutlined />}>新增合同</Button>
            <Button size="small" type="dashed">客户录入</Button>
            <Button size="small" type="dashed">进度填报</Button>
          </Space>
        </Col>
        <Col>
          <Badge dot>
            <Text type="secondary"><BellOutlined /> 系统通知：国庆节期间系统维护公告...</Text>
          </Badge>
        </Col>
      </Row>
    </Card>
  );
};

export default GlobalOverview;