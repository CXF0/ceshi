/**
 * @file web/src/services/notification.ts
 * @version 2.0.0 [2026-05-04]
 * @desc 修复：统一使用 @/utils/request（自带 token 拦截器），废弃自建 axios 实例
 */
import request from '@/utils/request';

/** 获取公告列表（管理端） */
export async function getNotifications(params?: any) {
  return request.get('/notifications', { params });
}

/** 获取公告详情 */
export async function getNotificationDetail(id: number | string) {
  return request.get(`/notifications/detail/${id}`);
}

/** 更新状态（发布 / 撤回） */
export async function updateNotificationStatus(id: number, status: number) {
  return request.patch(`/notifications/${id}/status`, { status });
}

/** 保存公告（新增 or 编辑） */
export async function saveNotification(data: any) {
  const { id, ...rest } = data;
  if (id) {
    return request.put(`/notifications/${id}`, rest);
  }
  return request.post('/notifications', data);
}

/** 删除公告 */
export async function deleteNotification(id: number | string) {
  return request.delete(`/notifications/${id}`);
}