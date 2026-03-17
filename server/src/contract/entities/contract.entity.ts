import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CrmCustomer } from '../../crm/crm-customer.entity';

// 💡 适配你要求的四个状态
export enum ContractStatus {
  DRAFT = 'draft',   // 草拟
  SIGNED = 'signed', // 签订
  ACTIVE = 'active', // 执行中
  CLOSED = 'closed', // 已结束
}

@Entity('crm_contracts')
export class CrmContract {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'dept_id', type: 'char', length: 36 })
  deptId: string;

  @Column({ name: 'customer_id', type: 'char'}) 
  customerId: string;

  @Column({ name: 'contract_no', type: 'varchar', length: 50 })
  contractNo: string;

  @Column({ 
    name: 'total_amount', 
    type: 'decimal', 
    precision: 12, 
    scale: 2, 
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0
    }
  })
  totalAmount: number;

  @Column({ name: 'signed_date', type: 'date', nullable: true })
  signedDate: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  // 💡 适配 DDL: payment_type
  @Column({ name: 'payment_type', type: 'varchar', length: 50, default: 'full' })
  paymentType: string;

  // 💡 适配 DDL: contract_type
  @Column({ name: 'contract_type', type: 'varchar', length: 20, default: 'enterprise' })
  contractType: string;

  // 💡 适配 DDL: is_refund
  @Column({ name: 'is_refund', type: 'tinyint', default: 0 })
  isRefund: number;

  // 💡 适配 DDL: refund_amount
  @Column({ 
    name: 'refund_amount', 
    type: 'decimal', 
    precision: 12, 
    scale: 2, 
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0
    }
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

  @ManyToOne(() => CrmCustomer)
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomer;
}