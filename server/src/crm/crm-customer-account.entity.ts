import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { CrmCustomer } from './crm-customer.entity'; // 引入你现有的客户实体

@Entity('crm_customer_accounts')
export class CrmCustomerAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ 
    type: 'enum', 
    enum: ['corporate', 'private'], 
    default: 'corporate',
    comment: '账户类型: corporate-对公, private-对私' 
  })
  type: 'corporate' | 'private';

  @Column({ name: 'account_name', comment: '单位名称或个人姓名' })
  accountName: string;

  // --- 对公字段 ---
  @Column({ name: 'usci_code', nullable: true, comment: '统一社会信用代码' })
  usciCode: string;

  @Column({ name: 'address_phone', nullable: true, comment: '地址及电话' })
  addressPhone: string;

  @Column({ name: 'bank_name', nullable: true, comment: '开户行名称' })
  bankName: string;

  @Column({ name: 'bank_account', nullable: true, comment: '银行账号/卡号' })
  bankAccount: string;

  @Column({ name: 'bank_code', nullable: true, comment: '行号' })
  bankCode: string;

  // --- 对私/通用补充 ---
  @Column({ name: 'alipay_account', nullable: true, comment: '支付宝账号' })
  alipayAccount: string;

  @Column({ name: 'is_default', default: false, comment: '是否为默认账户' })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 💡 建立多对一关联：多个账户属于一个客户
  @ManyToOne(() => CrmCustomer, (customer) => customer.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomer;
}