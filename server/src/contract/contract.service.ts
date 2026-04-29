/**
 * @file server/src/contract/contract.service.ts
 * @version 3.2.0 [2026-04-28]
 * @desc dept_id 为 string；leftJoinAndSelect dept；数据隔离
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  constructor(
    @InjectRepository(CrmContract)
    private readonly contractRepo: Repository<CrmContract>,
    @InjectRepository(Dept)
    private readonly deptRepo: Repository<Dept>,
  ) {}

  async findAll(query: any, user: any) {
    const {
      page = 1, pageSize = 10,
      contractNo, status, customerName, certType,
      signedDateStart, signedDateEnd,
    } = query;
    const filterDeptId = query.deptId ? String(query.deptId) : undefined;

    const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);

    const qb = this.contractRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.dept', 'dept');

    qb.andWhere('contract.deptId IN (:...visibleDeptIds)', { visibleDeptIds });

    if (filterDeptId && visibleDeptIds.includes(filterDeptId)) {
      qb.andWhere('contract.deptId = :filterDeptId', { filterDeptId });
    }

    if (contractNo)   qb.andWhere('contract.contractNo LIKE :contractNo', { contractNo: `%${contractNo}%` });
    if (status)       qb.andWhere('contract.status = :status', { status });
    if (customerName) qb.andWhere('customer.name LIKE :customerName', { customerName: `%${customerName}%` });
    if (certType) {
      qb.andWhere(new Brackets(sub => {
        sub.where('contract.certType = :certType', { certType })
          .orWhere('contract.certType IN (SELECT type_code FROM sys_certification_type WHERE parent_code = :certType)', { certType });
      }));
    }
    if (signedDateStart && signedDateEnd) {
      qb.andWhere('contract.signedDate BETWEEN :signedDateStart AND :signedDateEnd', { signedDateStart, signedDateEnd });
    }

    qb.orderBy('contract.id', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map(c => this.deserializeAttachments(c)),
      total, page: Number(page), pageSize: Number(pageSize),
    };
  }

  async findOne(id: string) {
    const contract = await this.contractRepo.findOne({
      where: { id: String(id) } as any,
      relations: ['customer', 'dept'],
    });
    if (!contract) throw new NotFoundException(`合同 ${id} 不存在`);
    return this.deserializeAttachments(contract);
  }

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

  async update(id: string | number, body: any): Promise<any> {
    const contract = await this.contractRepo.findOne({ where: { id: String(id) } as any });
    if (!contract) throw new NotFoundException(`未找到合同 ${id}`);
    const { customer: _c, dept: _d, id: _id, createTime: _ct, updateTime: _ut, attachments, ...updateData } = body;
    if (attachments !== undefined) {
      updateData.attachments = Array.isArray(attachments) ? JSON.stringify(attachments) : attachments;
    }
    const merged = this.contractRepo.merge(contract, updateData);
    const saved  = await this.contractRepo.save(merged) as unknown as CrmContract;
    return this.deserializeAttachments(saved);
  }

  async updateStatus(id: string, newStatus: string) {
    const contract = await this.contractRepo.findOne({ where: { id: String(id) } as any });
    if (!contract) throw new NotFoundException(`合同 ${id} 不存在`);
    const allowed = STATUS_FLOW[contract.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`状态「${contract.status}」不允许流转到「${newStatus}」`);
    }
    contract.status = newStatus;
    return this.contractRepo.save(contract);
  }

  async remove(id: string | number): Promise<void> {
    const exists = await this.contractRepo.findOne({ where: { id: String(id) } as any });
    if (!exists) throw new NotFoundException(`未找到合同 ${id}`);
    await this.contractRepo.delete(String(id));
  }

  private deserializeAttachments(contract: CrmContract): any {
    let attachments: any[] = [];
    try { attachments = contract.attachments ? JSON.parse(contract.attachments as string) : []; }
    catch { attachments = []; }
    return { ...contract, attachments };
  }
}