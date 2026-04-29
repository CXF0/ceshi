/**
 * @file server/src/crm/crm-customer.entity.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 新增 status（状态）字段 + deletedAt（软删除）字段
 */
import {
  Entity, Column, PrimaryGeneratedColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { CrmCustomerAccount } from './crm-customer-account.entity';

@Entity('crm_customers')
export class CrmCustomer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dept_id', type: 'char', length: 36 })
  deptId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'usci_code', length: 18, nullable: true })
  usciCode: string;

  @Column({ name: 'industry', length: 100, default: 'other' })
  industry: string;

  @Column({ name: 'level', length: 20, default: 'common' })
  level: string;

  @Column({ name: 'scale_count', type: 'int', default: 0 })
  scaleCount: number;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'contact_person', length: 50, nullable: true })
  contactPerson: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ length: 50, nullable: true })
  source: string;

  /**
   * 状态：1-正常，0-禁用
   * 禁用后在列表中仍可查看（通过状态筛选），不影响历史合同数据
   */
  @Column({ default: 1, comment: '状态：1-正常，0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 软删除时间戳
   * TypeORM 的 @DeleteDateColumn 装饰器会自动：
   * - softDelete() 时写入当前时间
   * - 所有 find/findOne 查询自动加上 WHERE deleted_at IS NULL
   */
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => CrmCustomerAccount, (account) => account.customer)
  accounts: CrmCustomerAccount[];
}