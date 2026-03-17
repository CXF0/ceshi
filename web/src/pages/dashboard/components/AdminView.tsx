import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';

interface AdminViewProps {
  data: any;
}

const AdminView: React.FC<AdminViewProps> = ({ data }) => {
  return (
    <Card title="系统全量概览" bordered={false}>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="累计合同金额"
            value={data?.totalAmount || 0}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix="￥"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="在办项目总数"
            value={data?.activeProjects || 0}
            valueStyle={{ color: '#cf1322' }}
            suffix="个"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="月度增长率"
            value={8.5}
            precision={1}
            valueStyle={{ color: '#3f8600' }}
            prefix={<ArrowUpOutlined />}
            suffix="%"
          />
        </Col>
      </Row>
    </Card>
  );
};

export default AdminView;