import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { NotificationTarget } from './notification-target.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ default: 1 })
  type: number; // 1-公告, 2-提醒, 3-活动

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'json', nullable: true })
  attachments: any;

  @Column({ name: 'target_scope', default: 'all' })
  targetScope: string; // all, custom

  @Column({ default: 1 })
  status: number; // 0-草稿, 1-发布, 2-撤回

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;

  @OneToMany(() => NotificationTarget, (target) => target.notification)
  targets: NotificationTarget[];
}