/**
 * @file web/src/services/notification.ts
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// 定义返回格式
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => Promise.reject(error)
);

// web/src/services/notification.ts

/** 💡 获取通知列表：对应后端的 @Get() */
export async function getNotifications(params?: any): Promise<ApiResponse> {
  // 注意：这里请求的是 /notifications，后端对应的就是 findAll 方法
  return request.get('/notifications', { params }) as any;
}

/** 💡 获取详情：必须对齐后端的 @Get('detail/:id') */
export async function getNotificationDetail(id: number | string): Promise<ApiResponse> {
  return request.get(`/notifications/detail/${id}`) as any;
}

/** 💡 更新状态：对齐后端的 @Patch(':id/status') */
export async function updateNotificationStatus(id: number, status: number): Promise<ApiResponse> {
  return request.patch(`/notifications/${id}/status`, { status }) as any;
}

/** 💡 保存/修改：确保 data 被正确放置 */
export async function saveNotification(data: any): Promise<ApiResponse> {
  const { id, ...rest } = data;
  
  if (id) {
    // 修改
    return request({
      url: `/notifications/${id}`,
      method: 'PUT',
      data: rest, // axios 的请求体必须放在 data 字段
    }) as any;
  }

  // 新增
  return request({
    url: '/notifications',
    method: 'POST',
    data: data, // 💡 确保这里的 data 是 { title: 'xxx', ... }
  }) as any;
}

/** 💡 删除：对齐后端的 @Delete(':id') */
export async function deleteNotification(id: number | string): Promise<ApiResponse> {
  return request.delete(`/notifications/${id}`) as any;
}