// src/pages/contract/detail/index.tsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import request from "../../../utils/request"; // 💡 注意：请确保导入的是你封装的 axios 实例

// 💡 定义接口，解决“找不到名称”报错
interface ContractRecord {
  id: number;
  contractNo: string;
  title: string;
  amount: number;
  status: number;
  startDate: string;
  endDate: string;
  customerId: number;
  customer?: { name: string };
  deptId: string;
  createdAt: string;
}

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // 💡 加上泛型更严谨
  const [data, setData] = useState<ContractRecord>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // 调用接口
    request.get(`/crm/contracts/${id}`)
      .then((res) => {
        setData(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <div>
      {/* 渲染逻辑... */}
      <h1>{data?.title}</h1>
    </div>
  );
};

export default ContractDetail;