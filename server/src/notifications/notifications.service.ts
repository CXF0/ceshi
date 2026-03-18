import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, Like } from 'typeorm';
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
   * 💡 接口1：管理端 - 获取公告列表 (带筛选)
   */
  async findAll(query: any) {
    const { title, type, status } = query;
    const where: any = {};

    if (title) where.title = Like(`%${title}%`);
    if (type !== undefined && type !== '') where.type = type;
    if (status !== undefined && status !== '') where.status = status;

    return await this.noticeRepo.find({
      where,
      order: {
        priority: 'DESC',
        createTime: 'DESC',
      },
    });
  }

  /**
   * 💡 接口2：用户端 - 获取当前用户可见的通知列表
   */
  async getMyNotifications(user: any) {
    const { userId, deptId, roleKey } = user;

    const query = this.noticeRepo.createQueryBuilder('n')
      .leftJoin('n.targets', 't')
      .where('n.status = :status', { status: 1 });

    query.andWhere(new Brackets(qb => {
      qb.where('n.targetScope = :all', { all: 'all' })
        .orWhere('(t.targetType = :userType AND t.targetId = :userId)', { userType: 'user', userId })
        .orWhere('(t.targetType = :deptType AND t.targetId = :deptId)', { deptType: 'dept', deptId })
        .orWhere('(t.targetType = :roleType AND t.targetId = :roleKey)', { roleType: 'role', roleKey });
    }));

    return await query
      .select(['n.id', 'n.title', 'n.type', 'n.createTime', 'n.viewCount', 'n.priority'])
      .groupBy('n.id')
      .orderBy('n.priority', 'DESC')
      .addOrderBy('n.createTime', 'DESC')
      .getMany();
  }

  /**
   * 💡 接口3：创建或更新通知
   * 修复：解决 Notification | null 的类型分配问题
   */
  async save(dto: any): Promise<Notification> {
    const { id, targets, ...noticeData } = dto;
    let notice: Notification;

    if (id) {
      // 编辑模式
      await this.noticeRepo.update(id, noticeData);
      const updatedNotice = await this.noticeRepo.findOne({ where: { id } });
      
      // 这里的校验解决了 "null" 不能赋值给 "Notification" 的问题
      if (!updatedNotice) {
        throw new NotFoundException(`未找到 ID 为 ${id} 的公告`);
      }
      notice = updatedNotice;

      // 清除并重新保存定向规则
      await this.targetRepo.delete({ noticeId: id });
    } else {
      // 新增模式
      notice = await this.noticeRepo.save(noticeData);
    }

    // 处理定向发布规则
    if (dto.targetScope === 'custom' && targets?.length > 0) {
      const targetEntities = targets.map((t: any) => ({
        ...t,
        noticeId: notice.id
      }));
      await this.targetRepo.save(targetEntities);
    }

    return notice;
  }

  /**
   * 💡 接口4：获取通知详情 (自增阅读量)
   */
  async getDetail(id: number): Promise<Notification> {
    const notice = await this.noticeRepo.findOne({
      where: { id },
      relations: ['targets']
    });

    if (!notice) {
      throw new NotFoundException(`ID为 ${id} 的通知不存在`);
    }

    this.noticeRepo.increment({ id }, 'viewCount', 1);
    return notice;
  }

  /**
   * 💡 接口5：快捷更新状态 (发布/撤回)
   */
  async updateStatus(id: number, status: number) {
    const notice = await this.noticeRepo.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('公告不存在');
    }
    
    return await this.noticeRepo.update(id, { status });
  }

  /**
   * 💡 接口6：点赞处理
   */
  async toggleLike(id: number, isLike: boolean) {
    const notice = await this.noticeRepo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException('通知不存在');

    const incrementValue = isLike ? 1 : -1;
    if (!isLike && notice.likeCount <= 0) return { count: 0 };

    await this.noticeRepo.increment({ id }, 'likeCount', incrementValue);
    
    const updated = await this.noticeRepo.findOne({ where: { id }, select: ['likeCount'] });
    return { count: updated?.likeCount || 0 };
  }

  /**
   * 💡 接口7：删除通知
   */
  async remove(id: number) {
    await this.targetRepo.delete({ noticeId: id });
    return await this.noticeRepo.delete(id);
  }
}