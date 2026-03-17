import React from 'react';
import { Card, Statistic, Progress } from 'antd';

interface SalesViewProps {
  data: any;
}

const SalesView: React.FC<SalesViewProps> = ({ data }) => {
  return (
    <Card title="销售业绩看板" bordered={false}>
      <Statistic
        title="本月回款"
        value={data?.monthlyRevenue || 0}
        precision={2}
        prefix="￥"
      />
      <div style={{ marginTop: 20 }}>
        <span>目标达成率</span>
        <Progress percent={data?.targetProgress || 0} status="active" />
      </div>
    </Card>
  );
};

export default SalesView;