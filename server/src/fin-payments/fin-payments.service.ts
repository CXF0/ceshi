import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinPayment } from './fin-payment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FinPaymentsService {
  constructor(
    @InjectRepository(FinPayment)
    private readonly repo: Repository<FinPayment>,
  ) {}

  /** 根据合同ID获取所有回款记录 */
  async findByContract(contractId: string) {
    return this.repo.find({
      where: { contractId },
      order: { phaseName: 'ASC' },
    });
  }

  /** 新增回款记录 */
  async create(body: Partial<FinPayment>) {
    const record = this.repo.create({ ...body, id: uuidv4() });
    return this.repo.save(record);
  }

  /** 更新回款记录（标记收款、开票等） */
  async update(id: string, body: Partial<FinPayment>) {
    const exists = await this.repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException(`回款记录 ${id} 不存在`);
    await this.repo.update(id, body);
    return this.repo.findOne({ where: { id } });
  }

  /** 删除回款记录 */
  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`回款记录 ${id} 不存在`);
    return { success: true };
  }

  /**
   * 统计合同回款汇总（用于 Dashboard）
   * 返回：总应收、总实收、未收金额、已开票数
   */
  async getSummaryByContract(contractId: string) {
    const payments = await this.findByContract(contractId);
    return {
      totalDue: payments.reduce((s, p) => s + p.amountDue, 0),
      totalPaid: payments.reduce((s, p) => s + p.amountPaid, 0),
      totalUnpaid: payments.reduce((s, p) => s + (p.amountDue - p.amountPaid), 0),
      invoicedCount: payments.filter(p => p.isInvoiced).length,
      phases: payments,
    };
  }
}