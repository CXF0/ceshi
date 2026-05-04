/**
 * @file server/src/dashboard/dashboard.service.ts
 * @version 3.1.0 [2026-05-04]
 * @desc 数据隔离修复：
 *   1. getAnnualReviewAlerts() 通过 customer.deptId 过滤可见范围
 *   2. getCertStats() 同上，不再全量统计
 *   3. getSummary() 中的 roleKey 判断同步对齐新角色（head_manager）
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

    // 获取当前用户可见的 deptId 范围（已在 dept-scope.util 统一控制）
    const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, roleKey);

    const result: any = {};

    const myDept = await this.deptRepo.findOne({ where: { id: String(user.deptId) } });
    result.deptName = myDept?.deptName || '正达认证';

    // 管理员统计（admin / head_manager / manager 均可见，数据范围由 visibleDeptIds 控制）
    if (['admin', 'head_manager', 'manager'].includes(roleKey)) {
      result.adminStats = await this.getAdminStats(visibleDeptIds, period);
    }

    // 年审预警（reviewer / admin / head_manager / manager）
    if (['admin', 'head_manager', 'manager', 'reviewer'].includes(roleKey)) {
      result.annualReviewAlerts = await this.getAnnualReviewAlerts(visibleDeptIds);
    }

    // 材料任务（consultant / admin / head_manager / manager）
    if (['admin', 'head_manager', 'manager', 'consultant'].includes(roleKey)) {
      result.consultantTasks = await this.getConsultantTasks(visibleDeptIds);
    }

    // 销售业绩（sales / admin / head_manager / manager）
    if (['admin', 'head_manager', 'manager', 'sales'].includes(roleKey)) {
      result.salesStats = await this.getSalesStats(visibleDeptIds, period, salesUserId);
      result.salesUsers = await this.getSalesUserList(visibleDeptIds);
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────
  // 1. 管理员全量统计（含数据权限）
  // ─────────────────────────────────────────────────────────
  private async getAdminStats(visibleDeptIds: string[], period: string) {
    const { start, end, prevStart, prevEnd } = this.getPeriodRange(period);

    const activeContracts = await this.contractRepo
      .createQueryBuilder('c')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status IN (:...statuses)', {
        statuses: [ContractStatus.SIGNED, ContractStatus.ACTIVE],
      })
      .getCount();

    const draftContracts = await this.contractRepo
      .createQueryBuilder('c')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status = :status', { status: ContractStatus.DRAFT })
      .getCount();

    const periodAmount = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'amount')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .andWhere('c.signedDate >= :start AND c.signedDate <= :end', { start, end })
      .getRawOne();

    const prevAmount = await this.contractRepo
      .createQueryBuilder('c')
      .select('SUM(c.totalAmount)', 'amount')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .andWhere('c.signedDate >= :start AND c.signedDate <= :end', { start: prevStart, end: prevEnd })
      .getRawOne();

    const thisAmt = parseFloat(periodAmount?.amount || '0');
    const prevAmt = parseFloat(prevAmount?.amount || '0');
    const growth  = prevAmt > 0
      ? parseFloat((((thisAmt - prevAmt) / prevAmt) * 100).toFixed(1))
      : 0;

    const statusDistrib = await this.contractRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(c.id)', 'count')
      .addSelect('SUM(c.totalAmount)', 'amount')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .groupBy('c.status')
      .getRawMany();

    const certDist = await this.contractRepo
      .createQueryBuilder('c')
      .innerJoin('sys_certification_type', 'ct', 'ct.type_code = c.certType')
      .select('ct.parent_code', 'parentCode')
      .addSelect('ct.parent_name', 'type')
      .addSelect('COUNT(c.id)', 'value')
      .addSelect('SUM(c.totalAmount)', 'amount')
      .where('c.deptId IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('c.certType IS NOT NULL')
      .andWhere('c.status != :status', { status: ContractStatus.DRAFT })
      .groupBy('ct.parent_code')
      .addGroupBy('ct.parent_name')
      .getRawMany();

    const distribution = certDist.map(d => ({
      type:   d.type,
      value:  parseInt(d.value),
      amount: parseFloat(d.amount || '0'),
    }));

    const certStats = await this.getCertStats(visibleDeptIds);

    return {
      activeProjects:          activeContracts,
      draftContracts,
      totalAmount:             thisAmt,
      periodGrowth:            growth,
      prevAmount:              prevAmt,
      contractCount:           parseInt(periodAmount?.count || '0'),
      statusDistribution:      statusDistrib,
      institutionDistribution: distribution,
      certStats,
      period,
    };
  }

  // ─────────────────────────────────────────────────────────
  // 2. 证书统计（修复：通过客户 deptId 过滤可见范围）
  // ─────────────────────────────────────────────────────────
  private async getCertStats(visibleDeptIds: string[]) {
    const today = new Date().toISOString().split('T')[0];
    const fmt   = (d: Date) => d.toISOString().split('T')[0];
    const d30   = new Date(); d30.setDate(d30.getDate() + 30);
    const d60   = new Date(); d60.setDate(d60.getDate() + 60);
    const d120  = new Date(); d120.setDate(d120.getDate() + 120);
    const d180  = new Date(); d180.setDate(d180.getDate() + 180);

    // ✅ 修复：通过 JOIN crm_customers 按 dept_id 过滤
    const base = () => this.certRepo
      .createQueryBuilder('c')
      .innerJoin('crm_customers', 'cust', 'cust.id = c.customer_id')
      .where('cust.dept_id IN (:...ids)', { ids: visibleDeptIds });

    const [expired, danger, warning, notice, normal] = await Promise.all([
      base().andWhere('c.expiry_date < :today', { today }).getCount(),
      base().andWhere('c.expiry_date >= :today AND c.expiry_date <= :d30', { today, d30: fmt(d30) }).getCount(),
      base().andWhere('c.expiry_date > :d30 AND c.expiry_date <= :d60', { d30: fmt(d30), d60: fmt(d60) }).getCount(),
      base().andWhere('c.expiry_date > :d60 AND c.expiry_date <= :d120', { d60: fmt(d60), d120: fmt(d120) }).getCount(),
      base().andWhere('c.expiry_date > :d180', { d180: fmt(d180) }).getCount(),
    ]);

    return { expired, danger, warning, notice, normal };
  }

  // ─────────────────────────────────────────────────────────
  // 3. 年审预警（修复：通过客户 deptId 过滤可见范围）
  // ─────────────────────────────────────────────────────────
  private async getAnnualReviewAlerts(visibleDeptIds: string[]) {
    const d180 = new Date(); d180.setDate(d180.getDate() + 180);
    const fmt  = (d: Date) => d.toISOString().split('T')[0];

    // ✅ 修复：JOIN crm_customers，按 dept_id IN visibleDeptIds 过滤
    const certs = await this.certRepo
      .createQueryBuilder('cert')
      .innerJoin('crm_customers', 'cust', 'cust.id = cert.customer_id')
      .leftJoinAndSelect('cert.customer', 'customer')
      .leftJoinAndSelect('cert.category', 'category')
      .where('cust.dept_id IN (:...ids)', { ids: visibleDeptIds })
      .andWhere('cert.expiry_date <= :d180', { d180: fmt(d180) })
      .andWhere('cert.status != :status', { status: 'revoked' })
      .orderBy('cert.expiry_date', 'ASC')
      .limit(30)
      .getMany();

    const today = new Date();
    return certs.map(cert => {
      const expiry = new Date(cert.expiry_date);
      const days   = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
      return {
        id:           cert.id,
        certificateNo: cert.certificate_number,
        customerName: (cert as any).customer?.name || '—',
        certTypeName: (cert as any).category?.type_name || cert.certificate_number,
        expiryDate:   cert.expiry_date,
        daysLeft:     days,
        status:       cert.status,
      };
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. 材料任务（草稿+已签约合同）
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
  // 5. 销售业绩
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

    const allUsers    = await this.userRepo.find({ where: { status: 1 } });
    const targetUsers = allUsers.filter((u: any) =>
      visibleDeptIds.includes(String(u.deptId)) && u.hasSalesTarget,
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

  // ─────────────────────────────────────────────────────────
  // 业绩曲线（按月）
  // ─────────────────────────────────────────────────────────
  private async getSalesTrend(visibleDeptIds: string[], period: string, salesUserId?: string) {
    const months: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();

    if (period === 'month') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: `${d.getMonth() + 1}月`,
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end:   new Date(d.getFullYear(), d.getMonth() + 1, 0),
        });
      }
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      for (let i = 3; i >= 0; i--) {
        const qIdx = (q - i + 40) % 4;
        const year = now.getFullYear() - Math.floor((i - q + 40) / 4);
        months.push({
          label: `Q${qIdx + 1}`,
          start: new Date(year, qIdx * 3, 1),
          end:   new Date(year, qIdx * 3 + 3, 0),
        });
      }
    } else {
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
      }),
    );
    return results;
  }

  // ─────────────────────────────────────────────────────────
  // 获取可选销售人员列表
  // ─────────────────────────────────────────────────────────
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
      const q  = Math.floor(now.getMonth() / 3);
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
      start    = new Date(now.getFullYear(), now.getMonth(), 1);
      end      = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    return { start, end, prevStart, prevEnd };
  }
}