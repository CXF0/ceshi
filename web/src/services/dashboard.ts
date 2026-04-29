import request from '@/utils/request';

export async function getDashboardSummary(params: {
  role: string;
  period?: string;      // month | quarter | year
  salesUserId?: string; // 销售人员筛选
}) {
  return request.get('/dashboard/summary', { params });
}