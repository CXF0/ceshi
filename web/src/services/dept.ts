/**
 * @file web/src/services/dept.ts
 * 对应后端 /api/depts — 组织架构（分公司）管理
 */
import request from '@/utils/request';

export interface DeptItem {
  id: string;       // char(36) UUID
  deptName: string;
  parentId?: string;
  leader?: string;
  phone?: string;
  status: number;   // 1-正常, 0-停用
  createdAt?: string;
}

/** 获取部门列表 */
export function getDepts(params?: { status?: number }) {
  return request.get<any, { code: number; data: DeptItem[] }>('/depts', { params });
}

/** 获取单个部门 */
export function getDeptById(id: string) {
  return request.get(`/depts/${id}`);
}

/** 创建部门 */
export function createDept(data: Partial<DeptItem>) {
  return request.post('/depts', data);
}

/** 更新部门 */
export function updateDept(id: string, data: Partial<DeptItem>) {
  return request.put(`/depts/${id}`, data);
}

/** 删除部门 */
export function deleteDept(id: string) {
  return request.delete(`/depts/${id}`);
}