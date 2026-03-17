import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, // 修改为自增生成
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

@Entity('sys_certification_institutions')
export class Institution {
  @PrimaryGeneratedColumn({ 
    type: 'int', 
    comment: '数据库自增ID' 
  })
  id: number; // 💡 物理主键，用于表关联

  @Column({ 
    type: 'varchar', 
    length: 50, 
    unique: true, // 💡 确保业务代码不重复
    comment: '机构业务代码(简写，如: CQC)' 
  })
  institution_code: string; // 💡 原本手动输入的字符串 ID

  @Column({ 
    type: 'varchar', 
    length: 255, 
    comment: '机构全称(开票抬头)' 
  })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    comment: '纳税人识别号' 
  })
  tax_no: string;

  @Column({ 
    type: 'varchar', 
    length: 500, 
    nullable: true, 
    comment: '开票地址及电话' 
  })
  address_phone: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    comment: '开户行' 
  })
  bank_name: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    comment: '银行账号' 
  })
  bank_account: string;

  @Column({ 
    type: 'decimal', 
    precision: 5, 
    scale: 2, 
    default: 6.0, 
    comment: '税点(百分比)' 
  })
  tax_point: number;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    comment: '联系人' 
  })
  contact_person: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    comment: '联系电话' 
  })
  contact_phone: string;

  @Column({ 
    type: 'text', 
    nullable: true, 
    comment: '业务范围描述' 
  })
  business_scope: string;

  @Column({ 
    type: 'tinyint', 
    default: 1, 
    comment: '1:启用, 0:禁用' 
  })
  is_active: number;

  @CreateDateColumn({ 
    type: 'datetime', 
    precision: 6,
    comment: '创建时间'
  })
  created_at: Date;

  @UpdateDateColumn({ 
    type: 'datetime', 
    precision: 6,
    comment: '更新时间'
  })
  updated_at: Date;
}