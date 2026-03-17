// src/services/contract.ts
import request from '@/utils/request';

export const ContractApi = {
  // 获取列表
  findAll: (params: any) => request.get('/contracts', { params }),
  // 获取单条详情
  findOne: (id: string) => request.get(`/contracts/${id}`),
  // 新增合同
  create: (data: any) => request.post('/contracts', data),
  // 更新合同
  update: (id: string, data: any) => request.put(`/contracts/${id}`, data),
  // 更新状态 (Patch 风格)
  updateStatus: (id: string, status: string) => request.patch(`/contracts/${id}/status`, { status }),
  // 删除合同
  remove: (id: string) => request.delete(`/contracts/${id}`),
};