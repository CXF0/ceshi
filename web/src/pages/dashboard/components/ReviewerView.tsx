import React from 'react';
import { Card, Table, Tag } from 'antd';

interface ReviewerViewProps {
  alerts: any[];
}

const ReviewerView: React.FC<ReviewerViewProps> = ({ alerts }) => {
  const columns = [
    { title: '合同编号', dataIndex: 'contract_no', key: 'no' },
    { title: '到期日期', dataIndex: 'expiry_date', key: 'expiry' },
    {
      title: '预警天数',
      key: 'days',
      render: (_: any, record: any) => {
        const diff = Math.ceil((new Date(record.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return <Tag color={diff < 7 ? 'red' : 'volcano'}>剩余 {diff} 天</Tag>;
      }
    },
  ];

  return (
    <Card title="证书年审到期预警" bordered={false}>
      <Table 
        dataSource={alerts} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 5 }} 
      />
    </Card>
  );
};

export default ReviewerView;