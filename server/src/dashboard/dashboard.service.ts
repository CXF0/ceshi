/**
 * @file server/src/dashboard/dashboard.service.ts
 * @version 3.0.0 [2026-04-29]
 * @desc 完整重写：数据权限、证书预警、合同统计、销售业绩
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmContract, ContractStatus } from '../contract/entities/contract.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { Dept } from '../dept/dept.entity';
import { User } from '../users/user.entity';
import { getDeptScope } from '../common/dept-scope.util';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CrmContract)
    private readonly contractRepo: Repository<CrmContract>,

    @InjectRepository(Certificate)
    private readonly certRepo: Repository<Certificate>,

    @InjectRepository(Dept)
    private readonly deptRepo: Repository<Dept>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ─────────────────────────────────────────────────────────
  // 主入口
  // ─────────────────────────────────────────────────────────
  async getSummary(user: any, options: { period: string; salesUserId?: string }) {
    const { period = 'month', salesUserId } = options;
    const roleKey = user.roleKey;

    // 1. 获取当前用户可见的 deptId 范围
    const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, roleKey);

    const result: any = {};

    // 公司名称（替换硬编码）
    const myDept = await this.deptRepo.findOne({ where: { id: String(user.deptId) } });
    result.deptName = myDept?.deptName || '正达认证';

    // 管理员/经理：全量统计
    if (roleKey === 'admin' || roleKey === 'manager') {
      result.adminStats = await this.getAdminStats(visibleDeptIds, period);
    }

    // 年审预警（reviewer/admin/manager）
    if (['admin', 'manager', 'reviewer'].includes(roleKey)) {
      result.annualReviewAlerts = await this.getAnnualReviewAlerts(visibleDeptIds);
    }

    // 材料任务（consultant/admin/manager）
    if (['admin', 'manager', 'consultant'].includes(roleKey)) {
      result.consultantTasks = await this.getConsultantTasks(visibleDeptIds);
    }

    // 销售业绩（sales/admin）
    if (['admin', 'sales', 'manager'].includes(roleKey)) {
      result.salesStats = await this.getSalesStats(visibleDeptIds, period, salesUserId);
      result.salesUsers = await this.getSalesUserList(visibleDeptIds);
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────
  // 1. 管理员全量统计（含数据权限）
  // ─────────────────────────────────────────────────────────
  private async getAdminStats(visibleDeptIds: string[], period: string) {
    // 时间范围
    const { start, end, prevStart, prevEnd } = this.getPeriodRange(period);

    // 未完结合同（非草稿、非已结项）
    const activeContracts = await this.contractRepo
      .createQueryBuilder('c')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status IN (:...statuses)', {
        statuses: [ContractStatus.SIGNED, ContractStatus.ACTIVE],
      })
      .getCount();

    // 在签合同（草稿）
    const draftContracts = await this.contractRepo
      .createQueryBuilder('c')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status = :status', { status: ContractStatus.DRAFT })
      .getCount();

    // 本期累计签约金额（已签约+执行中+已结项）
    const periodAmount = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'amount')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .andWhere('c.signedDate >= :start AND c.signedDate <= :end', { start, end })
      .getRawOne();

    // 上期数据（环比）
    const prevAmount = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'amount')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .andWhere('c.signedDate >= :start AND c.signedDate <= :end', { start: prevStart, end: prevEnd })
      .getRawOne();

    const thisAmt = parseFloat(periodAmount?.amount || '0');
    const prevAmt = parseFloat(prevAmount?.amount || '0');
    const growth  = prevAmt > 0 ? parseFloat((((thisAmt - prevAmt) / prevAmt) * 100).toFixed(1)) : 0;

    // 按合同状态分布（已签约 vs 执行中）
    const statusDistrib = await this.contractRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(c.id)', 'count')
      .addSelect('SUM(c.totalAmount)', 'amount')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .groupBy('c.status')
      .getRawMany();

    // 认证体系分布（基于当前可见合同）
    const certDist = await this.contractRepo
      .createQueryBuilder('c')
      .select('c.certType', 'type')
      .addSelect('COUNT(c.id)', 'value')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.certType IS NOT NULL')
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .groupBy('c.certType')
      .getRawMany();

    // 认证体系种类（需关联 cert-types 表获取名称，此处先用 type_code 返回）
    const distribution = certDist.map(d => ({
      type:  d.type,
      value: parseInt(d.value),
    }));

    // 证书年审预警统计
    const certStats = await this.getCertStats(visibleDeptIds);

    return {
      activeProjects:   activeContracts,    // 未完结合同
      draftContracts,                        // 在签（草稿）合同
      totalAmount:      thisAmt,
      periodGrowth:     growth,
      prevAmount:       prevAmt,
      contractCount:    parseInt(periodAmount?.count || '0'),
      statusDistribution: statusDistrib,
      institutionDistribution: distribution,
      certStats,
      period,
    };
  }

  // ─────────────────────────────────────────────────────────
  // 2. 证书统计
  // ─────────────────────────────────────────────────────────
  private async getCertStats(visibleDeptIds: string[]) {
    // 证书关联客户，客户关联 deptId，需要子查询
    // 简化：直接查所有证书（因证书没有直接 deptId，通过 customer_id 关联）
    // 这里返回全量证书统计，如需精确权限过滤可后续扩展
    const today = new Date().toISOString().split('T')[0];
    const d30   = new Date(); d30.setDate(d30.getDate() + 30);
    const d60   = new Date(); d60.setDate(d60.getDate() + 60);
    const d120  = new Date(); d120.setDate(d120.getDate() + 120);
    const d180  = new Date(); d180.setDate(d180.getDate() + 180);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const [expired, danger, warning, notice, normal] = await Promise.all([
      this.certRepo.createQueryBuilder('c').where('c.expiry_date < :today', { today }).getCount(),
      this.certRepo.createQueryBuilder('c').where('c.expiry_date >= :today AND c.expiry_date <= :d30', { today, d30: fmt(d30) }).getCount(),
      this.certRepo.createQueryBuilder('c').where('c.expiry_date > :d30 AND c.expiry_date <= :d60', { d30: fmt(d30), d60: fmt(d60) }).getCount(),
      this.certRepo.createQueryBuilder('c').where('c.expiry_date > :d60 AND c.expiry_date <= :d120', { d60: fmt(d60), d120: fmt(d120) }).getCount(),
      this.certRepo.createQueryBuilder('c').where('c.expiry_date > :d180', { d180: fmt(d180) }).getCount(),
    ]);

    return { expired, danger, warning, notice, normal };
  }

  // ─────────────────────────────────────────────────────────
  // 3. 年审预警（按紧急程度倒序）
  // ─────────────────────────────────────────────────────────
  private async getAnnualReviewAlerts(visibleDeptIds: string[]) {
    // 查 180 天内到期的证书，关联客户
    const d180 = new Date(); d180.setDate(d180.getDate() + 180);
    const fmt  = (d: Date) => d.toISOString().split('T')[0];

    const certs = await this.certRepo
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.customer', 'customer')
      .leftJoinAndSelect('cert.category', 'category')
      .where('cert.expiry_date <= :d180', { d180: fmt(d180) })
      .andWhere('cert.status != :status', { status: 'revoked' })
      .orderBy('cert.expiry_date', 'ASC') // 最紧急的排最前
      .limit(30)
      .getMany();

    const today = new Date();
    return certs.map(cert => {
      const expiry = new Date(cert.expiry_date);
      const days   = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
      return {
        id:             cert.id,
        certificateNo:  cert.certificate_number,
        customerName:   (cert as any).customer?.name || '—',
        certTypeName:   (cert as any).category?.type_name || cert.certificate_number,
        expiryDate:     cert.expiry_date,
        daysLeft:       days,
        status:         cert.status,
      };
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. 材料任务（草稿+已签约合同，支持跳转）
  // ─────────────────────────────────────────────────────────
  private async getConsultantTasks(visibleDeptIds: string[]) {
    return this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .leftJoinAndSelect('c.dept', 'dept')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status IN (:...statuses)', {
        statuses: [ContractStatus.DRAFT, ContractStatus.SIGNED],
      })
      .orderBy('c.signedDate', 'DESC')
      .limit(20)
      .getMany();
  }

  // ─────────────────────────────────────────────────────────
  // 5. 销售业绩（支持月度/季度/年度、按人员筛选）
  // ─────────────────────────────────────────────────────────
  private async getSalesStats(visibleDeptIds: string[], period: string, salesUserId?: string) {
    const { start, end, prevStart, prevEnd } = this.getPeriodRange(period);

    const buildQb = (s: Date, e: Date) => {
      const qb = this.contractRepo.createQueryBuilder('c')
        .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
        .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
        .andWhere('c.signedDate >= :start AND c.signedDate <= :end', { start: s, end: e });
      if (salesUserId) qb.andWhere('c.createBy = :salesUserId', { salesUserId });
      return qb;
    };

    const [thisPeriod, prevPeriod, followUp] = await Promise.all([
      buildQb(start, end).select('SUM(c.totalAmount)', 'revenue').addSelect('COUNT(c.id)', 'count').getRawOne(),
      buildQb(prevStart, prevEnd).select('SUM(c.totalAmount)', 'revenue').getRawOne(),
      this.contractRepo.createQueryBuilder('c')
        .select('COUNT(DISTINCT c.customerId)', 'count')
        .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
        .andWhere('c.status IN (:...statuses)', { statuses: [ContractStatus.SIGNED, ContractStatus.ACTIVE] })
        .getRawOne(),
    ]);

    const revenue     = parseFloat(thisPeriod?.revenue || '0');
    const lastRevenue = parseFloat(prevPeriod?.revenue  || '0');

    // ✅ 优化4：从用户表读取业绩月度目标，按周期放大
    const allUsers = await this.userRepo.find({ where: { status: 1 } });
    const targetUsers = allUsers.filter((u: any) =>
      visibleDeptIds.includes(String(u.deptId)) && u.hasSalesTarget
    );
    let monthlyTarget = 0;
    if (salesUserId) {
      const tu = targetUsers.find((u: any) => String(u.id) === salesUserId);
      monthlyTarget = tu ? Number((tu as any).salesTarget || 0) : 0;
    } else {
      monthlyTarget = targetUsers.reduce((s: number, u: any) => s + Number(u.salesTarget || 0), 0);
    }
    const TARGET = period === 'quarter' ? monthlyTarget * 3
                 : period === 'year'    ? monthlyTarget * 12
                 : monthlyTarget;

    // 业绩曲线数据（按月拆分，用于折线图）
    const trendData = await this.getSalesTrend(visibleDeptIds, period, salesUserId);

    return {
      periodRevenue:    revenue,
      lastRevenue,
      targetAmount:     TARGET,
      targetProgress:   TARGET > 0 ? Math.min(Math.round((revenue / TARGET) * 100), 100) : 0,
      newContractCount: parseInt(thisPeriod?.count || '0'),
      followUpCount:    parseInt(followUp?.count   || '0'),
      growth: lastRevenue > 0
        ? parseFloat((((revenue - lastRevenue) / lastRevenue) * 100).toFixed(1))
        : 0,
      trendData,
      period,
    };
  }

  // 业绩曲线（按月）
  private async getSalesTrend(visibleDeptIds: string[], period: string, salesUserId?: string) {
    const months: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();

    if (period === 'month') {
      // 近 6 个月每月数据
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: `${d.getMonth() + 1}月`,
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end:   new Date(d.getFullYear(), d.getMonth() + 1, 0),
        });
      }
    } else if (period === 'quarter') {
      // 近 4 个季度
      const q = Math.floor(now.getMonth() / 3);
      for (let i = 3; i >= 0; i--) {
        const qIdx   = (q - i + 40) % 4;
        const year   = now.getFullYear() - Math.floor((i - q + 40) / 4);
        const qStart = new Date(year, qIdx * 3, 1);
        const qEnd   = new Date(year, qIdx * 3 + 3, 0);
        months.push({ label: `Q${qIdx + 1}`, start: qStart, end: qEnd });
      }
    } else {
      // 年度：近 12 个月
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: `${d.getFullYear()}/${d.getMonth() + 1}`,
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end:   new Date(d.getFullYear(), d.getMonth() + 1, 0),
        });
      }
    }

    const results = await Promise.all(
      months.map(async m => {
        const qb = this.contractRepo.createQueryBuilder('c')
          .select('SUM(c.totalAmount)', 'revenue')
          .addSelect('COUNT(c.id)', 'count')
          .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
          .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
          .andWhere('c.signedDate >= :start AND c.signedDate <= :end', { start: m.start, end: m.end });
        if (salesUserId) qb.andWhere('c.createBy = :salesUserId', { salesUserId });
        const r = await qb.getRawOne();
        return {
          label:   m.label,
          revenue: parseFloat(r?.revenue || '0'),
          count:   parseInt(r?.count || '0'),
        };
      })
    );
    return results;
  }

  // 获取可选的销售人员列表
  private async getSalesUserList(visibleDeptIds: string[]) {
    const users = await this.userRepo.find({ where: { status: 1 } });
    return users
      .filter((u: any) => visibleDeptIds.includes(String(u.deptId)))
      .map((u: any) => ({
        id:             String(u.id),
        name:           u.nickname || u.username,
        hasSalesTarget: !!u.hasSalesTarget,
        salesTarget:    u.hasSalesTarget ? Number(u.salesTarget || 0) : null,
      }));
  }

  // ─────────────────────────────────────────────────────────
  // 工具方法
  // ─────────────────────────────────────────────────────────
  private getPeriodRange(period: string) {
    const now = new Date();
    let start: Date, end: Date, prevStart: Date, prevEnd: Date;

    if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      start    = new Date(now.getFullYear(), q * 3, 1);
      end      = new Date(now.getFullYear(), q * 3 + 3, 0);
      prevStart = new Date(now.getFullYear(), (q - 1) * 3, 1);
      prevEnd   = new Date(now.getFullYear(), q * 3, 0);
    } else if (period === 'year') {
      start    = new Date(now.getFullYear(), 0, 1);
      end      = new Date(now.getFullYear(), 11, 31);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd   = new Date(now.getFullYear() - 1, 11, 31);
    } else {
      // month（默认）
      start    = new Date(now.getFullYear(), now.getMonth(), 1);
      end      = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    return { start, end, prevStart, prevEnd };
  }

  private getTarget(period: string): number {
    // 可后续从配置表读取
    const targets: Record<string, number> = {
      month:   500000,
      quarter: 1500000,
      year:    6000000,
    };
    return targets[period] || 500000;
  }
}