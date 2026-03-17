import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notification } from './notification.entity';

@Entity('notification_targets')
export class NotificationTarget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'notice_id' })
  noticeId: number;

  @Column({ name: 'target_type' })
  targetType: string; // user, dept, role, dept_role

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ name: 'dept_id', nullable: true })
  deptId: number;

  @ManyToOne(() => Notification, (notice) => notice.targets)
  @JoinColumn({ name: 'notice_id' })
  notification: Notification;
}