import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { CrmCustomer } from './crm-customer.entity';

@Entity('crm_customer_maintenances')
export class CrmCustomerMaintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id', type: 'int', comment: '客户ID' })
  customerId: number;

  @Column({ name: 'maintainer', length: 100, comment: '维护人' })
  maintainer: string;

  @Column({ name: 'content', type: 'text', comment: '维护内容' })
  content: string;

  @CreateDateColumn({ name: 'maintained_at', type: 'datetime', comment: '维护时间' })
  maintainedAt: Date;

  @ManyToOne(() => CrmCustomer, customer => customer.maintenances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomer;
}