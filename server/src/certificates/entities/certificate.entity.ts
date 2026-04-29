/**
 * @file server/src/certificates/entities/certificate.entity.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 补充 ManyToOne 关联 CrmCustomer，使 leftJoinAndSelect 生效
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

  /** ✅ 新增：关联客户表，获取客户名称 */
  @ManyToOne(() => CrmCustomer)
  @JoinColumn({ name: 'customer_id' })
  customer: CrmCustomer;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updated_at: Date;
}