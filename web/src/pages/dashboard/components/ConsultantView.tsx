import React from 'react';
import { Card, Table, Tag } from 'antd';

interface ConsultantViewProps {
  data: any[];
}

const ConsultantView: React.FC<ConsultantViewProps> = ({ data }) => {
  const columns = [
    { title: '客户名称', dataIndex: ['client', 'name'], key: 'client' },
    { title: '认证项目', dataIndex: ['certificationType', 'type_name'], key: 'type' },
    { title: '签约日期', dataIndex: 'sign_date', key: 'signDate' },
    { 
      title: '材料状态', 
      dataIndex: 'material_status', 
      key: 'status',
      render: (text: string) => <Tag color="orange">{text === 'pending' ? '待起草' : text}</Tag>
    },
  ];

  return (
    <Card title="材料起草任务监控" bordered={false}>
      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 5 }} 
      />
    </Card>
  );
};

export default ConsultantView;