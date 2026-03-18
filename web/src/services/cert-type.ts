/**
 * @file web/src/services/cert-type.ts
 * 对齐后端 sys_certification_type 实体
 */
import request from '@/utils/request';

// 根据你的 Entity 定义前端接口类型
export interface CertTypeItem {
  id?: number;
  parent_code: string;
  parent_name: string;
  type_code: string;
  type_name: string;
  description?: string;
  remind_days: number;   // 对应实体：年审预警提前天数
  material_days: number; // 对应实体：材料起草时限
  sort: number;
  is_active: number;     // 1: 启用, 0: 禁用
  created_at?: string;
  updated_at?: string;
}

/** 获取认证类型列表 */
export async function getCertTypes(params?: any) {
  // 这里的 params 会被 axios 自动转换为 URL 查询字符串，如 ?parent_name=xxx
  return request.get('/cert-types', { params });
}

/** 保存或更新认证类型 */
export async function saveCertType(data: Partial<CertTypeItem>) {
  if (data.id) {
    return request.put(`/cert-types/${data.id}`, data);
  }
  return request.post('/cert-types', data);
}

/** 删除认证类型 (后端支持软删除) */
export async function deleteCertType(id: number) {
  return request.delete(`/cert-types/${id}`);
}