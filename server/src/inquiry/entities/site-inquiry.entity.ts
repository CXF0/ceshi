import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface ReplyRecord {
  content: string;
  operator: string;
  operatorId: number;
  createdAt: string;
}

@Entity('site_inquiries')
export class SiteInquiry {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @Column({ length: 50 }) name: string;
  @Column({ length: 20 }) phone: string;
  @Column({ length: 500, nullable: true }) content: string;
  @Column({ length: 30, default: 'website' }) source: string;
  @Column({ type: 'tinyint', default: 0 }) status: number;
  @Column({ name: 'follow_by', type: 'int', nullable: true }) followBy: number;
  @Column({ name: 'follow_name', length: 50, nullable: true }) followName: string;
  @Column({ name: 'follow_at', type: 'datetime', nullable: true }) followAt: Date;
  @Column({ type: 'json', nullable: true }) replies: ReplyRecord[];
  @Column({ name: 'is_read', type: 'tinyint', default: 0 }) isRead: number;
  @Column({ name: 'read_at', type: 'datetime', nullable: true }) readAt: Date;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' }) updatedAt: Date;
}