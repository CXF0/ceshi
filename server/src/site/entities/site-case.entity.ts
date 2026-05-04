import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_cases')
export class SiteCase {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'company_name', length: 200 })
  companyName: string;

  @Column({ length: 50 })
  industry: string;

  @Column({ name: 'cert_type', length: 200 })
  certType: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ length: 30, nullable: true })
  duration: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ name: 'logo_text', length: 4, default: '企' })
  logoText: string;

  @Column({ name: 'logo_color', length: 20, default: '#3b82f6' })
  logoColor: string;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string;

  @Column({ name: 'is_featured', type: 'tinyint', default: 0 })
  isFeatured: number;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}