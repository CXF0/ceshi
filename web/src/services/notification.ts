/**
 * @file web/src/services/notification.ts
 * @version 3.0.0 [2026-05-04]
 * @desc 统一使用 @/utils/request（自带 token 拦截器）
 *       注意：@/utils/request 的响应拦截器 return response（完整 AxiosResponse）
 *       所以调用方需要用 res.data.code / res.data.data / res.data.message 取值
 */
import request from '@/utils/request';

/** 获取公告列表（管理端，无需登录） */
export async function getNotifications(params?: any) {
  return request.get('/notifications', { params });
}

/** 获取公告详情（无需登录） */
export async function getNotificationDetail(id: number | string) {
  return request.get(`/notifications/detail/${id}`);
}

/** 更新状态（发布 / 撤回，需登录） */
export async function updateNotificationStatus(id: number, status: number) {
  return request.patch(`/notifications/${id}/status`, { status });
}

/** 保存公告（新增 or 编辑，需登录） */
export async function saveNotification(data: any) {
  const { id, ...rest } = data;
  if (id) {
    return request.put(`/notifications/${id}`, rest);
  }
  return request.post('/notifications', data);
}

/** 删除公告（需登录） */
export async function deleteNotification(id: number | string) {
  return request.delete(`/notifications/${id}`);
}