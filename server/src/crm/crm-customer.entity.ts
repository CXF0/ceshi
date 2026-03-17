import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
// 💡 记得引入你的账户实体文件
import { CrmCustomerAccount } from './crm-customer-account.entity'; 

@Entity('crm_customers')
export class CrmCustomer {
  @PrimaryGeneratedColumn() // 💡 必须自增，否则 create 时不传 ID 会报 500
  id: number;

  @Column({ name: 'dept_id', type: 'char', length: 36 }) // 💡 匹配数据库 char(36)
  deptId: string; // 💡 修改为 string

  @Column({ length: 200 })
  name: string; // 企业全称

  @Column({ name: 'usci_code', length: 18, nullable: true })
  usciCode: string; // 统一社会信用代码

  @Column({ name: 'industry', length: 100, default: 'other', comment: '行业分类' })
  industry: string;

  @Column({ name: 'level', length: 20, default: 'common', comment: '客户等级' })
  level: string;

  @Column({ name: 'scale_count', type: 'int', default: 0 })
  scaleCount: number; // 企业规模

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ name: 'contact_person', length: 50, nullable: true })
  contactPerson: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ length: 50, nullable: true })
  source: string; // 客户来源

  // 💡 将 any 修改为正确的一对多关联定义
  @OneToMany(() => CrmCustomerAccount, (account) => account.customer)
  accounts: CrmCustomerAccount[]; 
}