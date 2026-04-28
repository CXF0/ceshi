import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { NotificationTarget } from './notification-target.entity';

/**
 * 对应数据库表：notifications
 *
 * ⚠️ 原代码修正：
 * - 数据库有 create_by 字段（发布人ID），原 Entity 缺失
 * - create_time / update_time 在 DB 是普通 datetime（非 datetime(6)），精度不同
 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ comment: '通知标题' })
  title: string;

  @Column({ type: 'longtext', comment: '富文本内容' })
  content: string;

  @Column({ type: 'tinyint', default: 1, comment: '类型：1-系统公告, 2-任务提醒, 3-活动通知' })
  type: number;

  @Column({ type: 'tinyint', default: 0, comment: '优先级：0-普通, 1-紧急' })
  priority: number;

  @Column({ type: 'json', nullable: true, comment: '附件列表' })
  attachments: any;

  @Column({ name: 'target_scope', default: 'all', comment: '范围：all-全员, custom-定向发布' })
  targetScope: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态：0-草稿, 1-已发布, 2-已撤回' })
  status: number;

  @Column({ name: 'view_count', default: 0, comment: '总阅读量' })
  viewCount: number;

  @Column({ name: 'like_count', default: 0, comment: '总点赞数' })
  likeCount: number;

  /** ✅ 新增：数据库有此字段，原 Entity 缺失 */
  @Column({ name: 'create_by', type: 'int', nullable: true, comment: '创建者用户ID' })
  createBy: number;

  @CreateDateColumn({ name: 'create_time', type: 'datetime', comment: '创建/发布时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', type: 'datetime', comment: '更新时间' })
  updateTime: Date;

  @OneToMany(() => NotificationTarget, (target) => target.notification)
  targets: NotificationTarget[];
}