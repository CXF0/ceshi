import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_managers')
export class SiteManager {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ length: 50 }) name: string;
  @Column({ length: 100, default: '高级认证顾问' }) title: string;
  @Column({ length: 500, nullable: true }) bio: string;
  @Column({ name: 'avatar_url', length: 500, nullable: true }) avatarUrl: string;
  @Column({ name: 'qrcode_url', length: 500, nullable: true }) qrcodeUrl: string;
  @Column({ length: 200, default: '扫码立即咨询' }) tips: string;
  @Column({ name: 'sort_order', type: 'smallint', default: 0 }) sortOrder: number;
  @Column({ name: 'is_active', type: 'tinyint', default: 1 }) isActive: number;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' }) updatedAt: Date;
}