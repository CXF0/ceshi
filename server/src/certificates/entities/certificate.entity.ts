/**
 * @file server/src/certificates/entities/certificate.entity.ts
 * @version 2.1.0 [2026-05-03]
 * @desc 新增 contract_id 字段，支持从合同维度录入关联证书
 */
import {
  Column, Entity, PrimaryColumn,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { CertificationType } from '../../cert-types/entities/cert-type.entity';
import { CrmCustomer } from '../../crm/crm-customer.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'customer_id', type: 'varchar', comment: '关联客户ID' })
  customer_id: string;

  @Column({ name: 'category_id', type: 'int', comment: '关联认证类型ID' })
  category_id: number;

  // ✅ 新增：关联合同ID，null 表示从证书管理独立录入，有值表示从合同详情页录入
  @Column({ name: 'contract_id', type: 'int', nullable: true, comment: '关联合同ID，null表示非合同来源' })
  contract_id: number | null;

  @Column({ name: 'certificate_number', type: 'varchar', length: 100, comment: '证书编号' })
  certificate_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '颁发机构' })
  issuer: string;

  @Column({ name: 'issue_date', type: 'date', comment: '颁发日期' })
  issue_date: string;

  @Column({ name: 'expiry_date', type: 'date', comment: '到期日期' })
  expiry_date: string;

  @Column({
    type: 'enum',
    enum: ['valid', 'expiring', 'expired', 'revoked'],
    default: 'valid',
    comment: '状态',
  })
  status: string;

  @Column({ name: 'file_url', type: 'text', nullable: true, comment: '证书附件' })
  file_url: string;

  /** 关联认证类型 */
  @ManyToOne(() => CertificationType)
  @JoinColumn({ name: 'category_id' })
  category: CertificationType;

  /** 关联客户表 */
  @ManyToOne(() => CrmCustomer)
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomer;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updated_at: Date;
}