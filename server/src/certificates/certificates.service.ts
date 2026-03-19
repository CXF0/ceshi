import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, Not, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule'; // 💡 引入定时任务装饰器
import { Certificate } from './entities/certificate.entity';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @InjectRepository(Certificate)
    private readonly repo: Repository<Certificate>,
  ) {}

  /**
   * 💡 1. 核心定时任务：每天凌晨 00:01 自动触发
   */
  @Cron('0 1 0 * * *')
  async handleCron() {
    this.logger.log('--- 开始自动扫描证书过期状态 ---');
    await this.checkAndUpdateStatus();
    this.logger.log('--- 证书状态更新完成 ---');
  }

  /**
   * 💡 2. 封装的状态更新逻辑 (可被定时任务或手动调用)
   */
  async checkAndUpdateStatus() {
    const today = new Date();
    // 获取 30 天后的日期
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    // A. 处理已过期的：到期日期 < 今天 且 状态不是 'revoked' 或 'expired'
    const expiredRes = await this.repo.createQueryBuilder()
      .update()
      .set({ status: 'expired' })
      .where('expiry_date < CURRENT_DATE() AND status NOT IN (:...skip)', { 
        skip: ['expired', 'revoked'] 
      })
      .execute();

    // B. 处理即将到期的：到期日期在 [今天, 30天内] 且 状态是 'valid'
    const expiringRes = await this.repo.createQueryBuilder()
      .update()
      .set({ status: 'expiring' })
      .where('expiry_date BETWEEN CURRENT_DATE() AND :thirtyDaysLater', { 
        thirtyDaysLater: thirtyDaysLater.toISOString().split('T')[0] 
      })
      .andWhere('status = :status', { status: 'valid' })
      .execute();

    return {
      expiredUpdated: expiredRes.affected,
      expiringUpdated: expiringRes.affected
    };
  }

  // --- 以下是你原有的业务逻辑 ---

  async findAll(query: { customer_id?: string }) {
    const qb = this.repo.createQueryBuilder('cert');
    qb.leftJoinAndSelect('cert.category', 'category');

    if (query.customer_id) {
      qb.andWhere('cert.customer_id = :customer_id', { customer_id: query.customer_id });
    }

    qb.orderBy('cert.created_at', 'DESC');
    return await qb.getMany();
  }

  async create(body: any) {
    const newRecord = this.repo.create(body);
    const saved = await this.repo.save(newRecord);
    // 💡 建议：创建后立即跑一次状态检查，防止录入的是已过期证书
    await this.checkAndUpdateStatus();
    return saved;
  }

  async update(id: string, body: any) {
    const exists = await this.repo.findOne({ where: { id: id as any } });
    if (!exists) throw new NotFoundException('证书不存在');
    await this.repo.update(id, body);
    // 💡 建议：更新日期后立即触发状态检查
    await this.checkAndUpdateStatus();
    return { success: true };
  }

  async remove(id: string) {
    return await this.repo.delete(id);
  }
}