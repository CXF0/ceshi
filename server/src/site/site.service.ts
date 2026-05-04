/**
 * @file server/src/site/site.service.ts
 * @version 1.1.0 [2026-05-04]
 * @desc 修复 saveConfig 500：upsert 在 MySQL 对含 DEFAULT 列的表有兼容问题，
 *       改用 findOne → save（存在则更新，不存在则新建），完全绕开 upsert。
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig } from './entities/site-config.entity';
import { SiteServiceItem } from './entities/site-service.entity';
import { SiteCase } from './entities/site-case.entity';

@Injectable()
export class SiteService {
  private readonly logger = new Logger(SiteService.name);

  constructor(
    @InjectRepository(SiteConfig)      private configRepo: Repository<SiteConfig>,
    @InjectRepository(SiteServiceItem) private serviceRepo: Repository<SiteServiceItem>,
    @InjectRepository(SiteCase)        private caseRepo: Repository<SiteCase>,
  ) {}

  // ─── Config ───────────────────────────────────────────────

  /** 读取所有配置，合并成 key-value 对象返回 */
  async getConfig(): Promise<Record<string, any>> {
    const rows = await this.configRepo.find({ order: { sortOrder: 'ASC' } });
    const result: Record<string, any> = {};
    for (const row of rows) {
      try {
        result[row.configKey] = row.valueType === 'json'
          ? JSON.parse(row.configValue || 'null')
          : row.configValue;
      } catch {
        result[row.configKey] = row.configValue;
      }
    }
    return result;
  }

  /**
   * 批量保存配置
   * 修复：改用 findOne + save，避免 upsert 在 MySQL 对含 DEFAULT 列报错
   */
  async saveConfig(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      try {
        const isJson = typeof value === 'object' && value !== null;
        const strValue = isJson ? JSON.stringify(value) : String(value ?? '');
        const valueType = isJson ? 'json' : 'string';

        // 先查是否已存在
        let row = await this.configRepo.findOne({ where: { configKey: key } });

        if (row) {
          // 已存在 → 只更新 value 和 type
          row.configValue = strValue;
          row.valueType = valueType as any;
        } else {
          // 不存在 → 新建，带上必填字段的默认值
          row = this.configRepo.create({
            configKey: key,
            configValue: strValue,
            valueType: valueType as any,
            groupName: 'general',
            sortOrder: 0,
          });
        }

        await this.configRepo.save(row);
      } catch (err) {
        this.logger.error(`保存配置 [${key}] 失败: ${err.message}`);
        throw err; // 向上抛出，让 controller 返回 500 并记录日志
      }
    }
  }

  // ─── Services ─────────────────────────────────────────────

  async getServices(onlyActive = false) {
    const where: any = onlyActive ? { isActive: 1 } : {};
    return this.serviceRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  async createService(data: Partial<SiteServiceItem>) {
    const entity = this.serviceRepo.create(data);
    return this.serviceRepo.save(entity);
  }

  async updateService(id: number, data: Partial<SiteServiceItem>) {
    await this.serviceRepo.update(id, data);
    return this.serviceRepo.findOne({ where: { id } });
  }

  async deleteService(id: number) {
    return this.serviceRepo.delete(id);
  }

  // ─── Cases ────────────────────────────────────────────────

  async getCases(onlyActive = false) {
    const where: any = onlyActive ? { isActive: 1 } : {};
    return this.caseRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  async createCase(data: Partial<SiteCase>) {
    const entity = this.caseRepo.create(data);
    return this.caseRepo.save(entity);
  }

  async updateCase(id: number, data: Partial<SiteCase>) {
    await this.caseRepo.update(id, data);
    return this.caseRepo.findOne({ where: { id } });
  }

  async deleteCase(id: number) {
    return this.caseRepo.delete(id);
  }
}