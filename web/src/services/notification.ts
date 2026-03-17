import request from '../utils/request';

/** 获取当前用户可见的通知列表 */
export async function getMyNoticeList() {
  return request('/notifications/my-list', {
    method: 'GET',
  });
}

/** 获取通知详情 */
export async function getNoticeDetail(id: number) {
  return request(`/notifications/detail/${id}`, {
    method: 'GET',
  });
}

/** 发布通知 */
export async function publishNotice(data: any) {
  return request('/notifications/publish', {
    method: 'POST',
    data,
  });
}

