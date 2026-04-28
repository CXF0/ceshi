/**
 * @file dashboard.service.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 补全 salesStats 字段：lastMonthRevenue、monthlyGrowth、followUpCount、newContractCount
 *       补全 adminStats 字段：monthlyGrowth
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmContract, ContractStatus } from '../contract/entities/contract.entity';
import { CertificationType } from '../cert-types/entities/cert-type.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CrmContract)
    private readonly contractRepo: Repository<CrmContract>,

    @InjectRepository(CertificationType)
    private readonly certTypeRepo: Repository<CertificationType>,
  ) {}

  async getSummary(roleKey: string) {
    const result: any = {
      adminStats: null,
      annualReviewAlerts: [],
      consultantTasks: [],
      salesStats: null,
    };

    if (roleKey === 'admin' || roleKey === 'manager') {
      result.adminStats = await this.getAdminStats();
    }

    if (['admin', 'manager', 'reviewer'].includes(roleKey)) {
      result.annualReviewAlerts = await this.getAnnualReviewAlerts();
    }

    if (['admin', 'manager', 'consultant'].includes(roleKey)) {
      result.consultantTasks = await this.getConsultantTasks();
    }

    if (roleKey === 'admin' || roleKey === 'sales') {
      result.salesStats = await this.getSalesStats();
    }

    return result;
  }

  // ──────────────────────────────────────────
  // 管理员全局统计
  // ──────────────────────────────────────────
  private async getAdminStats() {
    const stats = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'totalAmount')
      .addSelect('COUNT(c.id)', 'contractCount')
      .where('c.status IN (:...statuses)', {
        statuses: [ContractStatus.SIGNED, ContractStatus.ACTIVE, ContractStatus.CLOSED],
      })
      .getRawOne();

    // 环比增长：本月 vs 上月签约总额
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthData = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'amount')
      .where('c.signedDate >= :start', { start: thisMonthStart })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .getRawOne();

    const lastMonthData = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'amount')
      .where('c.signedDate >= :start AND c.signedDate <= :end', {
        start: lastMonthStart,
        end: lastMonthEnd,
      })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .getRawOne();

    const thisAmt = parseFloat(thisMonthData?.amount || '0');
    const lastAmt = parseFloat(lastMonthData?.amount || '0');
    const monthlyGrowth = lastAmt > 0
      ? parseFloat((((thisAmt - lastAmt) / lastAmt) * 100).toFixed(1))
      : 0;

    const distribution = await this.contractRepo
      .createQueryBuilder('c')
      .select('c.certType', 'type')
      .addSelect('COUNT(c.id)', 'value')
      .where('c.certType IS NOT NULL')
      .groupBy('c.certType')
      .getRawMany();

    return {
      totalAmount:              parseFloat(stats?.totalAmount || '0'),
      activeProjects:           parseInt(stats?.contractCount || '0'),
      monthlyGrowth,
      institutionDistribution:  distribution.map(d => ({
        type:  d.type,
        value: parseInt(d.value),
      })),
    };
  }

  // ──────────────────────────────────────────
  // 年审预警
  // ──────────────────────────────────────────
  private async getAnnualReviewAlerts() {
    return this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .where('c.status = :status', { status: ContractStatus.ACTIVE })
      .andWhere('c.endDate IS NOT NULL')
      .andWhere('DATEDIFF(c.endDate, NOW()) <= 30')
      .andWhere('DATEDIFF(c.endDate, NOW()) >= -7') // 允许显示逾期 7 天内的
      .orderBy('c.endDate', 'ASC')
      .limit(20)
      .getMany();
  }

  // ──────────────────────────────────────────
  // 咨询任务
  // ──────────────────────────────────────────
  private async getConsultantTasks() {
    return this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .where('c.status = :status', { status: ContractStatus.SIGNED })
      .andWhere('c.signedDate IS NOT NULL')
      .orderBy('c.signedDate', 'DESC')
      .limit(20)
      .getMany();
  }

  // ──────────────────────────────────────────
  // 销售业绩
  // ──────────────────────────────────────────
  private async getSalesStats() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 本月回款
    const thisMonthData = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'revenue')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.signedDate >= :start', { start: thisMonthStart })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .getRawOne();

    // 上月回款
    const lastMonthData = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'revenue')
      .where('c.signedDate >= :start AND c.signedDate <= :end', {
        start: lastMonthStart,
        end: lastMonthEnd,
      })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .getRawOne();

    // 跟进客户数（有合同的客户去重）
    const followUpData = await this.contractRepo
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.customerId)', 'count')
      .where('c.status IN (:...statuses)', {
        statuses: [ContractStatus.SIGNED, ContractStatus.ACTIVE],
      })
      .getRawOne();

    const revenue          = parseFloat(thisMonthData?.revenue || '0');
    const lastRevenue      = parseFloat(lastMonthData?.revenue || '0');
    const newContractCount = parseInt(thisMonthData?.count    || '0');
    const followUpCount    = parseInt(followUpData?.count     || '0');
    const TARGET           = 500000; // 月度目标，可后续从配置表读取

    return {
      monthlyRevenue:   revenue,
      lastMonthRevenue: lastRevenue,
      targetAmount:     TARGET,
      targetProgress:   Math.min(Math.round((revenue / TARGET) * 100), 100),
      newContractCount,
      followUpCount,
    };
  }
}