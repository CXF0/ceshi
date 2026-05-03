/**
 * @file server/src/fin-payments/fin-payment.entity.ts
 * @version 2.1.0 [2026-05-03]
 * @desc 新增 invoice_url 发票附件字段
 */
import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CrmContract } from '../contract/entities/contract.entity';

@Entity('fin_payments')
export class FinPayment {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'dept_id', type: 'char', length: 36, comment: '所属分公司ID' })
  deptId: string;

  @Column({ name: 'contract_id', type: 'int', comment: '关联合同ID' })
  contractId: number;

  @Column({ name: 'phase_name', length: 50, nullable: true, comment: '款项阶段，如：首款、尾款' })
  phaseName: string;

  @Column({
    name: 'amount_due',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '应收金额',
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v) || 0,
    },
  })
  amountDue: number;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '实收金额',
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v) || 0,
    },
  })
  amountPaid: number;

  @Column({ name: 'is_invoiced', type: 'tinyint', default: 0, comment: '是否开票: 0-否, 1-是' })
  isInvoiced: number;

  @Column({ name: 'payment_date', type: 'date', nullable: true, comment: '实际收款日期' })
  paymentDate: string;

  // ✅ 新增：发票附件文件地址
  @Column({ name: 'invoice_url', type: 'text', nullable: true, comment: '发票附件文件地址' })
  invoiceUrl: string | null;

  @ManyToOne(() => CrmContract)
  @JoinColumn({ name: 'contract_id' })
  contract: CrmContract;
}