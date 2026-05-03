/**
 * @file web/src/services/crm.ts
 *
 * ⚠️ 变更说明（对比原文件）：
 * - CrmAccountApi 补充了 findByCustomer (GET) 方法，原代码缺失
 * - setDefault 路径从 /default 改为对齐后端 @Patch(':id/default')（不变，已正确）
 */
import request from '@/utils/request';

/** 客户主体 API */
export const CrmCustomerApi = {
  findAll: (params: any) => request.get('/crm/customers', { params }),
  findOne: (id: number) => request.get(`/crm/customers/${id}`),
  create: (data: any) => request.post('/crm/customers', data),
  update: (id: number, data: any) => request.put(`/crm/customers/${id}`, data),
  remove: (id: number) => request.delete(`/crm/customers/${id}`),
  /** ✅ 新增：新增客户维护记录 */
  addMaintenance: (id: number, content: string) => request.post(`/crm/customers/${id}/maintenances`, { content }),
};

/** 客户财务账户 API */
export const CrmAccountApi = {
  /** ✅ 新增：根据客户ID获取账户列表 */
  findByCustomer: (customerId: number) =>
    request.get('/crm/customer-accounts', { params: { customerId } }),

  create: (data: any) => request.post('/crm/customer-accounts', data),
  update: (id: number, data: any) => request.put(`/crm/customer-accounts/${id}`, data),
  setDefault: (id: number) => request.patch(`/crm/customer-accounts/${id}/default`),
  remove: (id: number) => request.delete(`/crm/customer-accounts/${id}`),
};