/**
 * @file server/src/crm/crm-customer.entity.ts
 * @version 3.1.0 [2026-04-28]
 * @desc dept_id 保持 char(36)/string，补充 @ManyToOne dept 关联
 */
import {
  Entity, Column, PrimaryGeneratedColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { CrmCustomerAccount } from './crm-customer-account.entity';
import { CrmCustomerMaintenance } from './crm-customer-maintenance.entity';
import { Dept } from '../dept/dept.entity';

@Entity('crm_customers')
export class CrmCustomer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dept_id', type: 'char', length: 36, comment: '所属分公司ID' })
  deptId: string;

  @Column({ length: 200, comment: '企业全称' })
  name: string;

  @Column({ name: 'usci_code', length: 18, nullable: true })
  usciCode: string;

  @Column({ name: 'industry', length: 50, default: 'other' })
  industry: string;

  @Column({ name: 'level', length: 20, default: 'common' })
  level: string;

  @Column({ name: 'contact_person', length: 50, nullable: true })
  contactPerson: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ length: 50, nullable: true })
  source: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ name: 'scale_count', type: 'int', default: 0 })
  scaleCount: number;

  @Column({ default: 1, comment: '状态：1-正常，0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => CrmCustomerAccount, account => account.customer)
  accounts: CrmCustomerAccount[];

    @OneToMany(() => CrmCustomerMaintenance, maintenance => maintenance.customer)
  maintenances: CrmCustomerMaintenance[];

  @Column({ name: 'created_by', length: 100, nullable: true, comment: '创建人' })
  createdBy: string;

  @Column({ name: 'updated_by', length: 100, nullable: true, comment: '更新人' })
  updatedBy: string;

  /** 关联部门，用于展示所属公司名称 */
  @ManyToOne(() => Dept)
  @JoinColumn({ name: 'dept_id' })
  dept: Dept;
}