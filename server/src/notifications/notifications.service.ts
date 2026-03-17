import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationTarget } from './entities/notification-target.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private noticeRepo: Repository<Notification>,
    @InjectRepository(NotificationTarget)
    private targetRepo: Repository<NotificationTarget>,
  ) {}

  /**
   * 💡 接口1：获取当前用户可见的通知列表
   */
  async getMyNotifications(user: any) {
    const { userId, deptId, roleKey } = user;

    const query = this.noticeRepo.createQueryBuilder('n')
      .leftJoin('n.targets', 't')
      .where('n.status = :status', { status: 1 });

    // 复杂的定向逻辑筛选
    query.andWhere(new Brackets(qb => {
      qb.where('n.targetScope = :all', { all: 'all' })
        .orWhere('(t.targetType = :userType AND t.targetId = :userId)', { userType: 'user', userId })
        .orWhere('(t.targetType = :deptType AND t.targetId = :deptId)', { deptType: 'dept', deptId })
        .orWhere('(t.targetType = :roleType AND t.targetId = :roleKey)', { roleType: 'role', roleKey });
    }));

    // 使用 groupBy 避免因多个 target 导致的重复数据
    return await query
      .select(['n.id', 'n.title', 'n.type', 'n.createTime', 'n.viewCount', 'n.targetScope'])
      .groupBy('n.id')
      .orderBy('n.createTime', 'DESC')
      .getMany();
  }

  /**
   * 💡 接口2：发布通知（保存主体及定向规则）
   */
  async create(createDto: any) {
    const { targets, ...noticeData } = createDto;
    
    // 1. 保存通知主体
    const notice = await this.noticeRepo.save(noticeData);

    // 2. 如果是定向发布，保存规则
    if (noticeData.targetScope === 'custom' && targets?.length > 0) {
      const targetEntities = targets.map(t => ({
        ...t,
        noticeId: notice.id
      }));
      await this.targetRepo.save(targetEntities);
    }
    return notice;
  }

  /**
   * 💡 接口3：获取通知详情（带阅读计数自增）
   */
  async getDetail(id: number) {
    const notice = await this.noticeRepo.findOne({
      where: { id },
      relations: ['targets']
    });

    if (!notice) {
      throw new NotFoundException(`ID为 ${id} 的通知不存在或已被删除`);
    }

    // ✨ 异步自增阅读量，不阻塞主流程
    this.noticeRepo.increment({ id }, 'viewCount', 1);

    return notice;
  }

  /**
   * 💡 接口4：点赞处理
   */
  async toggleLike(id: number, isLike: boolean) {
    const notice = await this.noticeRepo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException('通知不存在');

    // 根据前端传参增加或减少点赞数
    const incrementValue = isLike ? 1 : -1;
    
    // 确保点赞数不为负数
    if (!isLike && notice.likeCount <= 0) return { count: 0 };

    await this.noticeRepo.increment({ id }, 'likeCount', incrementValue);
    
    // 返回最新的点赞数
    const updated = await this.noticeRepo.findOne({ where: { id }, select: ['likeCount'] });
    return { count: updated?.likeCount || 0 };
  }

  /**
   * 💡 接口5：删除通知
   */
  async remove(id: number) {
    // 先删除关联的 target 规则（物理删除或级联删除）
    await this.targetRepo.delete({ noticeId: id });
    // 再删除通知主体
    return await this.noticeRepo.delete(id);
  }
}