// server/src/certification/entities/certificate.entity.ts
import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { CertificationType } from '../../cert-types/entities/cert-type.entity'; // 💡 确保路径与你的目录结构一致

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '关联客户ID' })
  customer_id: string;

  @Column({ comment: '关联认证类型ID (category_id)' })
  category_id: number;

  @Column({ comment: '证书编号' })
  certificate_number: string;

  @Column({ comment: '颁发机构', nullable: true })
  issuer: string;

  @Column({ type: 'date', comment: '颁发日期' })
  issue_date: string;

  @Column({ type: 'date', comment: '到期日期' })
  expiry_date: string;

  @Column({ 
    type: 'enum', 
    enum: ['valid', 'expiring', 'expired', 'revoked'], 
    default: 'valid',
    comment: '证书状态' 
  })
  status: string;

  @Column({ type: 'text', comment: '证书图片地址', nullable: true })
  file_url: string;

  /**
   * 💡 关键补充：定义与认证类型的多对一关系
   * 只有加上这个，Service 里的 .leftJoinAndSelect('cert.category', 'category') 才能生效
   */
  @ManyToOne(() => CertificationType)
  @JoinColumn({ name: 'category_id' }) // 指明数据库中对应的列名
  category: CertificationType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}