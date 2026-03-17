// src/services/crm.ts
import request from '@/utils/request';

/**
 * 客户主体 API (已对齐后端 @Controller('crm/customers'))
 */
export const CrmCustomerApi = {
  // 获取列表 - 路径改为 /crm/customers
  findAll: (params: any) => request.get('/crm/customers', { params }),
  
  // 获取单个详情 - 路径改为 /crm/customers/${id}
  findOne: (id: number) => request.get(`/crm/customers/${id}`),
  
  // 新增客户 - 路径改为 /crm/customers
  create: (data: any) => request.post('/crm/customers', data),
  
  // 更新客户 - 路径改为 /crm/customers/${id}
  update: (id: number, data: any) => request.put(`/crm/customers/${id}`, data),
  
  // 删除客户 - 路径改为 /crm/customers/${id}
  remove: (id: number) => request.delete(`/crm/customers/${id}`),
};

/**
 * 客户财务账户 API (已对齐后端 @Controller('crm/customer-accounts'))
 */
export const CrmAccountApi = {
  // 新增账户
  create: (data: any) => request.post('/crm/customer-accounts', data),
  // 更新账户
  update: (id: number, data: any) => request.put(`/crm/customer-accounts/${id}`, data),
  // 设置默认账户
  setDefault: (id: number) => request.patch(`/crm/customer-accounts/${id}/default`),
  // 删除账户
  remove: (id: number) => request.delete(`/crm/customer-accounts/${id}`),
};