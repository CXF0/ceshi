import request from '@/utils/request';

/**
 * 获取看板汇总数据
 * @param params { role: string } 当前用户角色
 * @returns 返回包含各视图所需的统计数据、预警列表和待办任务
 */
export async function getDashboardSummary(params: { role: string }) {
  return request('/dashboard/summary', {
    method: 'GET',
    params: {
      ...params,
    },
  });
}

/**
 * 获取年审预警详情（如果需要单独分页加载）
 */
export async function getAnnualReviewList(params?: any) {
  return request('/dashboard/annual-review', {
    method: 'GET',
    params,
  });
}

/**
 * 获取咨询材料待办详情
 */
export async function getConsultantTaskList(params?: any) {
  return request('/dashboard/consultant-tasks', {
    method: 'GET',
    params,
  });
}

/**
 * 快捷操作：标记材料为已完成
 * @param contractId 合同ID
 */
export async function completeMaterialTask(contractId: number) {
  return request(`/dashboard/material-task/${contractId}/complete`, {
    method: 'POST',
  });
}