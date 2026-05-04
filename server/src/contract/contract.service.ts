/**
 * @file server/src/contract/contract.service.ts
 * @version 3.4.0 [2026-05-04]
 * @desc 数据隔离修复 + 调试日志（确认 visibleDeptIds 是否生效）
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CrmContract, ContractStatus } from './entities/contract.entity';
import { Dept } from '../dept/dept.entity';
import { getDeptScope } from '../common/dept-scope.util';

const STATUS_FLOW: Record<string, string[]> = {
  [ContractStatus.DRAFT]:  [ContractStatus.SIGNED],
  [ContractStatus.SIGNED]: [ContractStatus.ACTIVE, ContractStatus.DRAFT],
  [ContractStatus.ACTIVE]: [ContractStatus.CLOSED],
  [ContractStatus.CLOSED]: [],
};

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    @InjectRepository(CrmContract)
    private readonly contractRepo: Repository<CrmContract>,
    @InjectRepository(Dept)
    private readonly deptRepo: Repository<Dept>,
  ) {}

  // ─────────────────────────────────────────────────────────
  // 列表查询（带数据隔离）
  // ─────────────────────────────────────────────────────────
  async findAll(query: any, user: any) {
    const {
      page = 1, pageSize = 10,
      contractNo, status, customerName, certType,
      signedDateStart, signedDateEnd,
    } = query;

    const filterDeptId = query.deptId ? String(query.deptId) : undefined;

    // ── 调试日志：确认 user 对象是否从 token 正确注入 ──
    this.logger.log(`[findAll] user = ${JSON.stringify(user)}`);

    if (!user || !user.deptId || !user.roleKey) {
      this.logger.error('[findAll] user 对象缺少 deptId 或 roleKey，数据隔离无法生效！');
      throw new ForbiddenException('用户信息异常，请重新登录');
    }

    const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);

    // ── 调试日志：确认可见范围 ──
    this.logger.log(`[findAll] user.deptId=${user.deptId}, roleKey=${user.roleKey}, visibleDeptIds=${JSON.stringify(visibleDeptIds)}`);

    if (!visibleDeptIds || visibleDeptIds.length === 0) {
      this.logger.warn('[findAll] visibleDeptIds 为空，返回空列表');
      return { items: [], total: 0, page: Number(page), pageSize: Number(pageSize) };
    }

    const qb = this.contractRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.dept', 'dept');

    // ✅ 核心过滤：只返回可见范围内的合同
    qb.andWhere('contract.deptId IN (:...visibleDeptIds)', { visibleDeptIds });

    // 前端筛选框选了某公司，且在可见范围内才生效
    if (filterDeptId && visibleDeptIds.includes(filterDeptId)) {
      qb.andWhere('contract.deptId = :filterDeptId', { filterDeptId });
    }

    if (contractNo) {
      qb.andWhere('contract.contractNo LIKE :contractNo', { contractNo: `%${contractNo}%` });
    }
    if (status) {
      qb.andWhere('contract.status = :status', { status });
    }
    if (customerName) {
      qb.andWhere('customer.name LIKE :customerName', { customerName: `%${customerName}%` });
    }
    if (certType) {
      qb.andWhere(
        new Brackets(sub => {
          sub
            .where('contract.certType = :certType', { certType })
            .orWhere(
              'contract.certType IN (SELECT type_code FROM sys_certification_type WHERE parent_code = :certType)',
              { certType },
            );
        }),
      );
    }
    if (signedDateStart && signedDateEnd) {
      qb.andWhere('contract.signedDate BETWEEN :signedDateStart AND :signedDateEnd', {
        signedDateStart,
        signedDateEnd,
      });
    }

    qb.orderBy('contract.id', 'DESC')
      .skip((Number(page) - 1) * Number(pageSize))
      .take(Number(pageSize));

    const [items, total] = await qb.getManyAndCount();

    // ── 调试日志：确认实际查询到的数量 ──
    this.logger.log(`[findAll] 查询结果 total=${total}，本页 ${items.length} 条`);

    return {
      items: items.map(c => this.deserializeAttachments(c)),
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  // ─────────────────────────────────────────────────────────
  // 单条详情（带数据权限校验）
  // ─────────────────────────────────────────────────────────
  async findOne(id: string, user?: any): Promise<any> {
    const contract = await this.contractRepo.findOne({
      where: { id: String(id) } as any,
      relations: ['customer', 'dept'],
    });
    if (!contract) throw new NotFoundException(`合同 ${id} 不存在`);

    if (user) {
      const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);
      if (!visibleDeptIds.includes(String(contract.deptId))) {
        throw new ForbiddenException('无权访问该合同');
      }
    }

    return this.deserializeAttachments(contract);
  }

  // ─────────────────────────────────────────────────────────
  // 创建合同（deptId 强制来自 token）
  // ─────────────────────────────────────────────────────────
  async create(body: any, user: any): Promise<any> {
    const { attachments, ...rest } = body;
    const entity = this.contractRepo.create({
      ...rest,
      deptId:      String(user.deptId),
      createBy:    user.username || user.nickname,
      attachments: attachments ? JSON.stringify(attachments) : null,
    });
    const saved = await this.contractRepo.save(entity) as unknown as CrmContract;
    return this.deserializeAttachments(saved);
  }

  // ─────────────────────────────────────────────────────────
  // 更新合同（强制剔除 deptId，防止数据归属被篡改）
  // ─────────────────────────────────────────────────────────
  async update(id: number, body: any, user?: any): Promise<any> {
    const contract = await this.contractRepo.findOne({ where: { id: Number(id) } as any });
    if (!contract) throw new NotFoundException(`未找到合同 ${id}`);

    if (user) {
      const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);
      if (!visibleDeptIds.includes(String(contract.deptId))) {
        throw new ForbiddenException('无权修改该合同');
      }
    }

    // ✅ 强制剔除 deptId，无论前端传什么都不允许覆盖
    const {
      customer: _c,
      dept: _d,
      id: _id,
      createTime: _ct,
      updateTime: _ut,
      deptId: _deptId,
      attachments,
      ...updateData
    } = body;

    if (attachments !== undefined) {
      updateData.attachments = Array.isArray(attachments)
        ? JSON.stringify(attachments)
        : attachments;
    }

    const merged = this.contractRepo.merge(contract, updateData);
    const saved  = await this.contractRepo.save(merged) as unknown as CrmContract;
    return this.deserializeAttachments(saved);
  }

  // ─────────────────────────────────────────────────────────
  // 状态流转
  // ─────────────────────────────────────────────────────────
  async updateStatus(id: number, newStatus: string, user?: any) {
    const contract = await this.contractRepo.findOne({ where: { id: Number(id) } as any });
    if (!contract) throw new NotFoundException(`合同 ${id} 不存在`);

    if (user) {
      const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);
      if (!visibleDeptIds.includes(String(contract.deptId))) {
        throw new ForbiddenException('无权操作该合同');
      }
    }

    const allowed = STATUS_FLOW[contract.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `状态「${contract.status}」不允许流转到「${newStatus}」`,
      );
    }
    contract.status = newStatus;
    return this.contractRepo.save(contract);
  }

  // ─────────────────────────────────────────────────────────
  // 删除合同（带数据权限校验）
  // ─────────────────────────────────────────────────────────
  async remove(id: number, user?: any): Promise<void> {
    const exists = await this.contractRepo.findOne({ where: { id: Number(id) } as any });
    if (!exists) throw new NotFoundException(`未找到合同 ${id}`);

    if (user) {
      const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);
      if (!visibleDeptIds.includes(String(exists.deptId))) {
        throw new ForbiddenException('无权删除该合同');
      }
    }

    await this.contractRepo.delete(Number(id));
  }

  // ─────────────────────────────────────────────────────────
  // 私有工具
  // ─────────────────────────────────────────────────────────
  private deserializeAttachments(contract: CrmContract): any {
    let attachments: any[] = [];
    try {
      attachments = contract.attachments
        ? JSON.parse(contract.attachments as string)
        : [];
    } catch {
      attachments = [];
    }
    return { ...contract, attachments };
  }
}