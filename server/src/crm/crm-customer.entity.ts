import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CrmCustomerAccount } from './crm-customer-account.entity';

/**
 * 对应数据库表：crm_customers
 *
 * ⚠️ 关键修正（对比原代码）：
 * 1. dept_id 在数据库里是 char(36) → 对应 string 类型 ✅（已修正）
 * 2. 数据库有 created_at / updated_at 字段，原 Entity 缺失 → 已补充
 * 3. scale_count 在 DB 中是 int，原代码已正确
 */
@Entity('crm_customers')
export class CrmCustomer {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ name: 'dept_id', type: 'char', length: 36, comment: '所属分部ID' })
  deptId: string;

  @Column({ length: 200, comment: '企业全称' })
  name: string;

  @Column({ name: 'usci_code', length: 18, nullable: true, comment: '统一社会信用代码' })
  usciCode: string;

  @Column({
    name: 'industry',
    length: 50,
    default: 'other',
    comment: '行业: agriculture-农林牧渔, manufacturing-制造业, wholesale-批发零售, tech-信息技术, other-其他',
  })
  industry: string;

  @Column({
    name: 'level',
    length: 20,
    default: 'common',
    comment: '等级: vip-VIP, common-普通, channel-渠道',
  })
  level: string;

  @Column({ name: 'contact_person', length: 50, nullable: true, comment: '联系人' })
  contactPerson: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true, comment: '联系电话' })
  contactPhone: string;

  @Column({
    length: 50,
    nullable: true,
    comment: '客户来源: 老客户推荐, 电销获客, 网络获客, 渠道推荐, 业务拜访, 其他',
  })
  source: string;

  @Column({ length: 500, nullable: true, comment: '详细地址' })
  address: string;

  @Column({ name: 'scale_count', type: 'int', default: 0, comment: '人员规模' })
  scaleCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
  updatedAt: Date;

  @OneToMany(() => CrmCustomerAccount, (account) => account.customer)
  accounts: CrmCustomerAccount[];
}