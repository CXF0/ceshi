/**
 * @file server/src/contract/contract.service.ts
 * @version 2.2.0 [2026-04-28]
 * @desc 修复：save() 加 as CrmContract 断言，解决返回联合类型歧义
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CrmContract, ContractStatus } from './entities/contract.entity';

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
  ) {}

  async findAll(query: any, user: any) {
    const { page = 1, pageSize = 10, contractNo, status, customerName, certType, signedDateStart, signedDateEnd } = query;
    const qb = this.contractRepo.createQueryBuilder('contract').leftJoinAndSelect('contract.customer', 'customer');
    if (user.roleKey !== 'admin' && user.deptId) qb.andWhere('contract.deptId = :deptId', { deptId: user.deptId });
    if (contractNo)   qb.andWhere('contract.contractNo LIKE :contractNo', { contractNo: '%' + contractNo + '%' });
    if (status)       qb.andWhere('contract.status = :status', { status });
    if (customerName) qb.andWhere('customer.name LIKE :customerName', { customerName: '%' + customerName + '%' });
    if (certType) {
      qb.andWhere(new Brackets(sub => {
        sub.where('contract.certType = :certType', { certType })
           .orWhere('contract.certType IN (SELECT type_code FROM sys_certification_type WHERE parent_code = :certType)', { certType });
      }));
    }
    if (signedDateStart && signedDateEnd) qb.andWhere('contract.signedDate BETWEEN :signedDateStart AND :signedDateEnd', { signedDateStart, signedDateEnd });
    qb.orderBy('contract.id', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(c => this.deserializeAttachments(c)), total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOne(id: string) {
    const contract = await this.contractRepo.findOne({ where: { id: String(id) } as any, relations: ['customer'] });
    if (!contract) throw new NotFoundException('合同 ' + id + ' 不存在');
    return this.deserializeAttachments(contract);
  }

  async create(body: any, user: any): Promise<any> {
    const { attachments, ...rest } = body;
    const entity = this.contractRepo.create({
      ...rest,
      deptId:      user.deptId,
      createBy:    user.username || user.nickname,
      attachments: attachments ? JSON.stringify(attachments) : null,
    });
    const saved = await this.contractRepo.save(entity) as unknown as CrmContract;
    return this.deserializeAttachments(saved);
  }

  async update(id: string | number, body: any): Promise<any> {
    const contract = await this.contractRepo.findOne({ where: { id: String(id) } as any });
    if (!contract) throw new NotFoundException('未找到合同 ' + id);
    const { customer: _c, id: _id, createTime: _ct, updateTime: _ut, attachments, ...updateData } = body;
    if (attachments !== undefined) {
      updateData.attachments = Array.isArray(attachments) ? JSON.stringify(attachments) : attachments;
    }
    const merged = this.contractRepo.merge(contract, updateData);
    const saved = await this.contractRepo.save(merged) as CrmContract;
    return this.deserializeAttachments(saved);
  }

  async updateStatus(id: string, newStatus: string) {
    const contract = await this.contractRepo.findOne({ where: { id: String(id) } as any });
    if (!contract) throw new NotFoundException('合同 ' + id + ' 不存在');
    const allowed = STATUS_FLOW[contract.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException('状态不允许流转到 ' + newStatus + '，合法路径：' + (allowed.join('、') || '无'));
    }
    contract.status = newStatus;
    return this.contractRepo.save(contract);
  }

  async remove(id: string | number): Promise<void> {
    const exists = await this.contractRepo.findOne({ where: { id: String(id) } as any });
    if (!exists) throw new NotFoundException('未找到合同 ' + id);
    await this.contractRepo.delete(String(id));
  }

  private deserializeAttachments(contract: CrmContract): any {
    let attachments: any[] = [];
    try { attachments = contract.attachments ? JSON.parse(contract.attachments as string) : []; } catch { attachments = []; }
    return { ...contract, attachments };
  }
}