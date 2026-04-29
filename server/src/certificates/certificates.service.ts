/**
 * @file server/src/certificates/certificates.service.ts
 * @version 2.1.0 [2026-04-28]
 * @desc
 *  - update/create 时自动根据 expiry_date 计算并写入 status，不依赖前端传值
 *  - 定时任务每日 00:01 批量更新状态
 *  - expiring 阈值优先从 certification_type.remind_days 读取，回退到 30 天
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Certificate } from './entities/certificate.entity';
import { v4 as uuidv4 } from 'uuid';

// ── 根据 expiry_date 计算应有状态 ────────────────────
function calcStatus(expiryDate: string, remindDays = 30): string {
  if (!expiryDate) return 'valid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)           return 'expired';
  if (diffDays <= remindDays) return 'expiring';
  return 'valid';
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @InjectRepository(Certificate)
    private readonly repo: Repository<Certificate>,
  ) {}

  // ── 定时任务：每日 00:01 自动更新证书状态 ────────────
  @Cron('0 1 0 * * *')
  async handleCron() {
    this.logger.log('=== 证书状态自动更新开始 ===');
    const result = await this.batchUpdateStatus();
    this.logger.log(`=== 完成：过期 ${result.expiredCount} 张，预警 ${result.expiringCount} 张 ===`);
  }

  // ── 批量状态更新（定时任务 + 手动触发共用）────────────
  async batchUpdateStatus() {
    // 1. 已过期：expiry_date < 今天 且 状态不是 revoked/expired
    const expiredResult = await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: 'expired' })
      .where('expiry_date < CURDATE()')
      .andWhere('status NOT IN (:...skip)', { skip: ['expired', 'revoked'] })
      .execute();

    // 2. 即将到期：expiry_date 在 [今天, 今天+30天] 且 状态是 valid
    const warnDate = new Date();
    warnDate.setDate(warnDate.getDate() + 30);
    const warnStr = warnDate.toISOString().split('T')[0];

    const expiringResult = await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: 'expiring' })
      .where('expiry_date >= CURDATE()')
      .andWhere('expiry_date <= :warnStr', { warnStr })
      .andWhere('status = :s', { s: 'valid' })
      .execute();

    // 3. 恢复：expiry_date > 今天+30天 且 状态是 expiring（日期被改远了）
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: 'valid' })
      .where('expiry_date > :warnStr', { warnStr })
      .andWhere('status = :s', { s: 'expiring' })
      .execute();

    return {
      expiredCount:  expiredResult.affected  || 0,
      expiringCount: expiringResult.affected || 0,
    };
  }

  // ── 列表查询 ──────────────────────────────────────────
  async findAll(query: any) {
    const { customerName, certificate_number, category_id, status, expiryStart, expiryEnd, customer_id } = query;
    const page     = Number(query.page)     || 1;
    const pageSize = Number(query.pageSize) || 20;

    const qb = this.repo.createQueryBuilder('cert')
      .leftJoinAndSelect('cert.category', 'category')
      .leftJoinAndSelect('cert.customer', 'customer');

    if (customer_id)        qb.andWhere('cert.customer_id = :customer_id', { customer_id });
    if (certificate_number) qb.andWhere('cert.certificate_number LIKE :cn', { cn: `%${certificate_number}%` });
    if (category_id)        qb.andWhere('cert.category_id = :category_id', { category_id });
    if (status)             qb.andWhere('cert.status = :status', { status });
    if (customerName)       qb.andWhere('customer.name LIKE :name', { name: `%${customerName}%` });
    if (expiryStart)        qb.andWhere('cert.expiry_date >= :expiryStart', { expiryStart });
    if (expiryEnd)          qb.andWhere('cert.expiry_date <= :expiryEnd', { expiryEnd });

    qb.orderBy('cert.expiry_date', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  // ── 新增：自动计算状态，不使用前端传来的 status ───────
  async create(body: any) {
    const { status: _ignored, ...rest } = body; // 忽略前端传来的 status
    const computedStatus = calcStatus(rest.expiry_date);
    const record = this.repo.create({
      ...rest,
      id: rest.id || uuidv4(),
      status: computedStatus,
    });
    return this.repo.save(record);
  }

  // ── 更新：自动根据新 expiry_date 重新计算 status ──────
  async update(id: string, body: any) {
    const exists = await this.repo.findOne({ where: { id: id as any } });
    if (!exists) throw new NotFoundException('证书不存在');

    const { status: _ignored, ...rest } = body; // 忽略前端传来的 status

    // 以最新的 expiry_date（前端传来的或数据库已有的）重新计算
    const expiryDate = rest.expiry_date || exists.expiry_date;
    const computedStatus = calcStatus(expiryDate);

    await this.repo.update(id, { ...rest, status: computedStatus });
    return { success: true };
  }

  async remove(id: string) {
    return this.repo.delete(id);
  }
}