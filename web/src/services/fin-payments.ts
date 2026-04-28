/**
 * @file web/src/services/fin-payments.ts
 * 对应后端 /api/fin-payments — 合同回款管理
 */
import request from '@/utils/request';

export interface FinPaymentItem {
  id?: string;
  deptId?: string;
  contractId: string;
  phaseName?: string;    // 阶段名称，如：首款、阶段二、尾款
  amountDue: number;     // 应收金额
  amountPaid?: number;   // 实收金额
  isInvoiced?: number;   // 是否开票：0-否, 1-是
  paymentDate?: string;  // 实际收款日期 YYYY-MM-DD
}

export interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  totalUnpaid: number;
  invoicedCount: number;
  phases: FinPaymentItem[];
}

/** 按合同ID获取回款列表 */
export function getPaymentsByContract(contractId: string) {
  return request.get<any, { code: number; data: FinPaymentItem[] }>('/fin-payments', {
    params: { contractId },
  });
}

/** 获取合同回款汇总（用于合同详情页卡片） */
export function getPaymentSummary(contractId: string) {
  return request.get<any, { code: number; data: PaymentSummary }>('/fin-payments/summary', {
    params: { contractId },
  });
}

/** 新增回款阶段 */
export function createPayment(data: FinPaymentItem) {
  return request.post('/fin-payments', data);
}

/** 更新回款记录（标记收款/开票） */
export function updatePayment(id: string, data: Partial<FinPaymentItem>) {
  return request.put(`/fin-payments/${id}`, data);
}

/** 删除回款记录 */
export function deletePayment(id: string) {
  return request.delete(`/fin-payments/${id}`);
}