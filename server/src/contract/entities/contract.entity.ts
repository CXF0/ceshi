/**
 * @file server/src/contract/entities/contract.entity.ts
 * @version 3.1.0 [2026-04-28]
 * @desc dept_id 保持 char/string，补充 dept 关联
 */
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CrmCustomer } from '../../crm/crm-customer.entity';
import { Dept } from '../../dept/dept.entity';

export enum ContractStatus {
  DRAFT  = 'draft',
  SIGNED = 'signed',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('crm_contracts')
export class CrmContract {
  @PrimaryColumn()
  id: number;

  @Column({ name: 'dept_id', type: 'char', length: 36, nullable: true, comment: '所属分公司ID' })
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

  @Column({ name: 'attachment_url', type: 'varchar', length: 255, nullable: true })
  attachmentUrl: string;

  @Column({ name: 'attachments', type: 'text', nullable: true })
  attachments: string;

  @Column({ name: 'create_by', type: 'varchar', length: 50, nullable: true })
  createBy: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark: string;

  @ManyToOne(() => CrmCustomer)
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomer;

  /** 关联部门，展示所属公司名称 */
  @ManyToOne(() => Dept)
  @JoinColumn({ name: 'dept_id' })
  dept: Dept;
}