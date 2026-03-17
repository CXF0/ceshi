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

  /**
   * 看板数据汇总入口
   */
  async getSummary(roleKey: string) {
    const result: any = {
      adminStats: null,
      annualReviewAlerts: [],
      consultantTasks: [],
      salesStats: null,
    };

    // 1. 管理员/经理：获取真实全量财务统计
    if (roleKey === 'admin' || roleKey === 'manager') {
      result.adminStats = await this.getAdminStats();
    }

    // 2. 年审专员/管理员：获取真实到期预警
    if (roleKey === 'admin' || roleKey === 'manager' || roleKey === 'reviewer') {
      result.annualReviewAlerts = await this.getAnnualReviewAlerts();
    }

    // 3. 咨询专员/管理员：获取真实待办任务
    if (roleKey === 'admin' || roleKey === 'manager' || roleKey === 'consultant') {
      result.consultantTasks = await this.getConsultantTasks();
    }

    // 4. 销售/管理员：获取销售业绩统计
    if (roleKey === 'admin' || roleKey === 'sales') {
      result.salesStats = await this.getSalesStats();
    }

    return result;
  }

  /**
   * 获取管理员全局统计数据（真实 SQL 聚合）
   */
  private async getAdminStats() {
    const stats = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'totalAmount')
      .addSelect('COUNT(c.id)', 'contractCount')
      // 只统计已签订及之后的合同
      .where('c.status IN (:...statuses)', { 
        statuses: [ContractStatus.SIGNED, ContractStatus.ACTIVE, ContractStatus.CLOSED] 
      })
      .getRawOne();

    // 统计各机构证书分布（基于实体的 certType 字段分组）
    const distribution = await this.contractRepo
      .createQueryBuilder('c')
      .select('c.certType', 'type')
      .addSelect('COUNT(c.id)', 'value')
      .where('c.certType IS NOT NULL')
      .groupBy('c.certType')
      .getRawMany();

    return {
      totalAmount: parseFloat(stats?.totalAmount || 0),
      activeProjects: parseInt(stats?.contractCount || 0),
      institutionDistribution: distribution.map(item => ({
        type: item.type,
        value: parseInt(item.value)
      })),
    };
  }

  /**
   * 获取年审预警数据（真实 SQL 逻辑： endDate - 当前时间 <= 30天）
   */
  private async getAnnualReviewAlerts() {
    return await this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .where('c.status = :status', { status: ContractStatus.ACTIVE })
      .andWhere('c.endDate IS NOT NULL')
      // 筛选 30 天内到期的合同
      .andWhere('DATEDIFF(c.endDate, NOW()) <= 30')
      .andWhere('DATEDIFF(c.endDate, NOW()) >= 0')
      .orderBy('c.endDate', 'ASC')
      .limit(10)
      .getMany();
  }

  /**
   * 获取咨询任务监控（真实 SQL 逻辑：已签约但未结束的合同）
   */
  private async getConsultantTasks() {
    return await this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .where('c.status = :status', { status: ContractStatus.SIGNED })
      .andWhere('c.signedDate IS NOT NULL')
      // 这里的逻辑可以根据业务调整，例如签约后超过 7 天仍未进入执行状态的任务
      .orderBy('c.signedDate', 'DESC')
      .limit(10)
      .getMany();
  }

  /**
   * 获取销售业绩统计（真实 SQL 聚合）
   */
  private async getSalesStats() {
    // 获取本月第一天
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyData = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'revenue')
      .where('c.signedDate >= :firstDay', { firstDay })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .getRawOne();

    const revenue = parseFloat(monthlyData?.revenue || 0);
    const target = 500000; // 假设月度目标为 50w，实际可从配置表读取

    return {
      monthlyRevenue: revenue,
      targetProgress: Math.min(Math.round((revenue / target) * 100), 100),
    };
  }
}