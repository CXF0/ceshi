/**
 * @file server/src/notifications/entities/notification-like.entity.ts
 * @version 1.0.0 [2026-05-04]
 * @desc 点赞记录表，防止同一用户重复点赞同一公告
 *
 * 对应 SQL（需手动执行）：
 * CREATE TABLE notification_likes (
 *   id         INT AUTO_INCREMENT PRIMARY KEY,
 *   notice_id  INT NOT NULL COMMENT '公告ID',
 *   user_id    INT NOT NULL COMMENT '点赞用户ID',
 *   created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
 *   UNIQUE KEY uk_notice_user (notice_id, user_id)
 * ) COMMENT='公告点赞记录';
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notification_likes')
@Index('uk_notice_user', ['noticeId', 'userId'], { unique: true })
export class NotificationLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'notice_id', type: 'int', comment: '公告ID' })
  noticeId: number;

  @Column({ name: 'user_id', type: 'int', comment: '点赞用户ID' })
  userId: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '点赞时间' })
  createdAt: Date;
}