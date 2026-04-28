/**
 * @file web/src/services/audit-tasks.ts
 * 对应后端 /api/audit-tasks — 审核作业管理
 */
import request from '@/utils/request';

export type AuditType = '初审' | '监审' | '再认证';
export type AuditStatus = 'pending' | 'audit-in-progress' | 'completed' | 'cancelled';

export interface AuditTaskItem {
  id?: string;
  deptId?: string;
  contractId: string;
  auditType?: AuditType;
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  auditTeamLeader?: string;   // hr_staffs.id (UUID)
  auditTeamMembers?: string;  // 逗号分隔的 hr_staffs.id
  auditScope?: string;
  decisionResult?: string;
  status?: AuditStatus;
}

/** 获取审核任务列表（可按合同、部门、状态筛选） */
export function getAuditTasks(params?: { contractId?: string; deptId?: string; status?: AuditStatus }) {
  return request.get('/audit-tasks', { params });
}

/** 新增审核任务 */
export function createAuditTask(data: AuditTaskItem) {
  return request.post('/audit-tasks', data);
}

/** 更新审核任务 */
export function updateAuditTask(id: string, data: Partial<AuditTaskItem>) {
  return request.put(`/audit-tasks/${id}`, data);
}

/** 删除审核任务 */
export function deleteAuditTask(id: string) {
  return request.delete(`/audit-tasks/${id}`);
}