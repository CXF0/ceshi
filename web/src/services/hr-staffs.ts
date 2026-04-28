/**
 * @file web/src/services/hr-staffs.ts
 * 对应后端 /api/hr-staffs — 审核人员资源池
 */
import request from '@/utils/request';

export interface CertInfo {
  name: string;       // 证书名称，如：ISO9001主任审核员
  certNo?: string;    // 证书编号
  validUntil?: string; // 有效期
}

export interface HrStaffItem {
  id?: string;        // char(36) UUID
  deptId: string;
  name: string;
  staffType?: '专职' | '兼职';
  idCard?: string;
  certInfo?: CertInfo[];
  expertiseCodes?: string;  // 逗号分隔的专业代码
  status?: 'normal' | 'resigned' | 'frozen';
}

/** 获取人员列表 */
export function getHrStaffs(params?: {
  deptId?: string;
  name?: string;
  staffType?: string;
  status?: string;
}) {
  return request.get('/hr-staffs', { params });
}

/** 创建人员 */
export function createHrStaff(data: HrStaffItem) {
  return request.post('/hr-staffs', data);
}

/** 更新人员 */
export function updateHrStaff(id: string, data: Partial<HrStaffItem>) {
  return request.put(`/hr-staffs/${id}`, data);
}

/** 删除人员 */
export function deleteHrStaff(id: string) {
  return request.delete(`/hr-staffs/${id}`);
}