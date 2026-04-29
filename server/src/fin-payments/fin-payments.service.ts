/**
 * @file server/src/fin-payments/fin-payments.service.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 修复：create 时自动从关联合同取 deptId，解决 dept_id 无默认值报错
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinPayment } from './fin-payment.entity';
import { CrmContract } from '../contract/entities/contract.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FinPaymentsService {
  constructor(
    @InjectRepository(FinPayment)
    private readonly repo: Repository<FinPayment>,

    @InjectRepository(CrmContract)
    private readonly contractRepo: Repository<CrmContract>,
  ) {}

  async findByContract(contractId: number) {
    return this.repo.find({
      where: { contractId },
      order: { phaseName: 'ASC' },
    });
  }

  /** 新增回款记录：自动从合同取 deptId */
  async create(body: Partial<FinPayment>) {
    // 如果前端没传 deptId，从合同记录里取
    let deptId = body.deptId;
    if (!deptId && body.contractId) {
      const contract = await this.contractRepo.findOne({
        where: { id: Number(body.contractId) } as any,
      });
      deptId = contract?.deptId;
    }

    const record = this.repo.create({
      ...body,
      id: uuidv4(),
      deptId,
    });
    return this.repo.save(record);
  }

  async update(id: string, body: Partial<FinPayment>) {
    const exists = await this.repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException(`回款记录 ${id} 不存在`);
    await this.repo.update(id, body);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`回款记录 ${id} 不存在`);
    return { success: true };
  }

  async getSummaryByContract(contractId: number) {
    const payments = await this.findByContract(contractId);
    return {
      totalDue:      payments.reduce((s, p) => s + p.amountDue, 0),
      totalPaid:     payments.reduce((s, p) => s + p.amountPaid, 0),
      totalUnpaid:   payments.reduce((s, p) => s + (p.amountDue - p.amountPaid), 0),
      invoicedCount: payments.filter(p => p.isInvoiced).length,
      phases:        payments,
    };
  }
}