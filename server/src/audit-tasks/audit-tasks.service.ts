import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTask } from './audit-task.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditTasksService {
  constructor(
    @InjectRepository(AuditTask)
    private readonly repo: Repository<AuditTask>,
  ) {}

  async findAll(query: { contractId?: string; deptId?: string; status?: string }) {
    const qb = this.repo.createQueryBuilder('task');
    if (query.contractId) qb.andWhere('task.contractId = :contractId', { contractId: query.contractId });
    if (query.deptId) qb.andWhere('task.deptId = :deptId', { deptId: query.deptId });
    if (query.status) qb.andWhere('task.status = :status', { status: query.status });
    return qb.orderBy('task.startDate', 'ASC').getMany();
  }

  async findOne(id: string) {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`审核任务 ${id} 不存在`);
    return task;
  }

  async create(body: Partial<AuditTask>, user: { deptId: number }) {
    const record = this.repo.create({
      ...body,
      id: uuidv4(),
      deptId: String(user.deptId),
    });
    return this.repo.save(record);
  }

  async update(id: string, body: Partial<AuditTask>) {
    await this.findOne(id); // throws if not found
    await this.repo.update(id, body);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { success: true };
  }
}