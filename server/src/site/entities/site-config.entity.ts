import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('site_config')
export class SiteConfig {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index({ unique: true })
  @Column({ name: 'config_key', length: 100, comment: '配置键' })
  configKey: string;

  @Column({ name: 'config_value', type: 'longtext', nullable: true })
  configValue: string;

  @Column({ name: 'value_type', type: 'enum', enum: ['string', 'number', 'boolean', 'json'], default: 'string' })
  valueType: string;

  @Column({ name: 'group_name', length: 50, default: 'general' })
  groupName: string;

  @Column({ length: 100, nullable: true })
  label: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}