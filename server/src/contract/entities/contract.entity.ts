/**
 * @file server/src/contract/entities/contract.entity.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 补充 attachments（多附件JSON）、createBy 字段
 */
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CrmCustomer } from '../../crm/crm-customer.entity';

export enum ContractStatus {
  DRAFT  = 'draft',   // 草稿
  SIGNED = 'signed',  // 已签约
  ACTIVE = 'active',  // 执行中
  CLOSED = 'closed',  // 已结项
}

@Entity('crm_contracts')
export class CrmContract {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'dept_id', type: 'char', length: 36 })
  deptId: string;

  @Column({ name: 'customer_id', type: 'char' })
  customerId: string;

  @Column({ name: 'contract_no', type: 'varchar', length: 50 })
  contractNo: string;

  @Column({
    name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) || 0 },
  })
  totalAmount: number;

  @Column({ name: 'signed_date', type: 'date', nullable: true })
  signedDate: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ name: 'payment_type', type: 'varchar', length: 50, default: 'full' })
  paymentType: string;

  @Column({ name: 'contract_type', type: 'varchar', length: 20, default: 'enterprise' })
  contractType: string;

  @Column({ name: 'is_refund', type: 'tinyint', default: 0 })
  isRefund: number;

  @Column({
    name: 'refund_amount', type: 'decimal', precision: 12, scale: 2, default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) || 0 },
  })
  refundAmount: number;

  @Column({ name: 'cert_type', type: 'varchar', length: 50, nullable: true })
  certType: string;

  @Column({ name: 'cert_level', type: 'varchar', length: 20, nullable: true })
  certLevel: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: ContractStatus.DRAFT })
  status: string;

  /** 旧的单附件字段（保留兼容性） */
  @Column({ name: 'attachment_url', type: 'varchar', length: 255, nullable: true })
  attachmentUrl: string;

  /**
   * 多附件：JSON 数组存储，格式：
   * [{ name: '合同扫描件.pdf', url: '/static/xxx.pdf', size: 102400 }]
   * 数据库字段：attachments TEXT
   */
  @Column({ name: 'attachments', type: 'text', nullable: true, comment: '多附件JSON数组' })
  attachments: string;

  @Column({ name: 'create_by', type: 'varchar', length: 50, nullable: true })
  createBy: string;

  @Column({ name: 'remark', type: 'text', nullable: true, comment: '备注' })
  remark: string;

  @ManyToOne(() => CrmCustomer)
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomer;
}