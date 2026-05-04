/**
 * @file server/src/notifications/notifications.service.ts
 * @version 2.1.0 [2026-05-04]
 * @desc 修复：getMyNotifications select 补全全部列表所需字段（含 likeCount、priority 等）
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, Like } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationTarget } from './entities/notification-target.entity';
import { NotificationLike } from './entities/notification-like.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private noticeRepo: Repository<Notification>,

    @InjectRepository(NotificationTarget)
    private targetRepo: Repository<NotificationTarget>,

    @InjectRepository(NotificationLike)
    private likeRepo: Repository<NotificationLike>,
  ) {}

  /** 管理端：列表查询 */
  async findAll(query: any) {
    const { title, type, status } = query;
    const where: any = {};
    if (title)                                where.title  = Like(`%${title}%`);
    if (type   !== undefined && type   !== '') where.type   = type;
    if (status !== undefined && status !== '') where.status = status;

    return this.noticeRepo.find({
      where,
      order: { priority: 'DESC', createTime: 'DESC' },
    });
  }

  /**
   * 用户端：获取当前用户可见的通知列表
   * ✅ 修复：select 补全所有卡片展示所需字段
   */
  async getMyNotifications(user: any) {
    const { userId, deptId, roleKey } = user;

    const qb = this.noticeRepo.createQueryBuilder('n')
      .leftJoin('n.targets', 't')
      .where('n.status = :status', { status: 1 });

    qb.andWhere(new Brackets(sub => {
      sub
        .where('n.targetScope = :all', { all: 'all' })
        .orWhere('(t.targetType = :userType AND t.targetId = :userId)',   { userType: 'user', userId })
        .orWhere('(t.targetType = :deptType AND t.targetId = :deptId)',  { deptType: 'dept', deptId })
        .orWhere('(t.targetType = :roleType AND t.targetId = :roleKey)', { roleType: 'role', roleKey });
    }));

    return qb
      .select([
        'n.id',
        'n.title',
        'n.type',
        'n.priority',
        'n.targetScope',
        'n.status',
        'n.viewCount',
        'n.likeCount',
        'n.createTime',
      ])
      .groupBy('n.id')
      .orderBy('n.priority', 'DESC')
      .addOrderBy('n.createTime', 'DESC')
      .getMany();
  }

  /** 创建或更新通知 */
  async save(dto: any): Promise<Notification> {
    const { id, targets, ...noticeData } = dto;
    let notice: Notification;

    if (id) {
      await this.noticeRepo.update(id, noticeData);
      const updated = await this.noticeRepo.findOne({ where: { id } });
      if (!updated) throw new NotFoundException(`未找到 ID 为 ${id} 的公告`);
      notice = updated;
      await this.targetRepo.delete({ noticeId: id });
    } else {
      notice = await this.noticeRepo.save(noticeData);
    }

    if (dto.targetScope === 'custom' && targets?.length > 0) {
      const entities = targets.map((t: any) => ({ ...t, noticeId: notice.id }));
      await this.targetRepo.save(entities);
    }

    return notice;
  }

  /** 获取详情（自增阅读量） */
  async getDetail(id: number): Promise<Notification> {
    const notice = await this.noticeRepo.findOne({ where: { id }, relations: ['targets'] });
    if (!notice) throw new NotFoundException(`ID为 ${id} 的通知不存在`);
    this.noticeRepo.increment({ id }, 'viewCount', 1);
    return notice;
  }

  /** 更新状态（发布/撤回） */
  async updateStatus(id: number, status: number) {
    const notice = await this.noticeRepo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException('公告不存在');
    return this.noticeRepo.update(id, { status });
  }

  /**
   * 点赞 / 取消点赞（防重复）
   */
  async toggleLike(noticeId: number, userId: number) {
    const notice = await this.noticeRepo.findOne({ where: { id: noticeId } });
    if (!notice) throw new NotFoundException('通知不存在');

    const existing = await this.likeRepo.findOne({ where: { noticeId, userId } });

    if (existing) {
      await this.likeRepo.delete({ noticeId, userId });
      const newCount = Math.max(0, notice.likeCount - 1);
      await this.noticeRepo.update(noticeId, { likeCount: newCount });
      return { liked: false, count: newCount };
    } else {
      await this.likeRepo.save({ noticeId, userId });
      const newCount = notice.likeCount + 1;
      await this.noticeRepo.update(noticeId, { likeCount: newCount });
      return { liked: true, count: newCount };
    }
  }

  /** 查询当前用户是否已点赞 */
  async getLikeStatus(noticeId: number, userId: number): Promise<boolean> {
    const record = await this.likeRepo.findOne({ where: { noticeId, userId } });
    return !!record;
  }

  /** 删除通知 */
  async remove(id: number) {
    await this.targetRepo.delete({ noticeId: id });
    await this.likeRepo.delete({ noticeId: id });
    return this.noticeRepo.delete(id);
  }
}