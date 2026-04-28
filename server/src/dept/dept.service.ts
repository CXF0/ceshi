import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dept } from './dept.entity';

@Injectable()
export class DeptService {
  constructor(
    @InjectRepository(Dept)
    private readonly repo: Repository<Dept>,
  ) {}

  async findAll(query?: { status?: number }) {
    const where: any = {};
    if (query?.status !== undefined) where.status = query.status;
    return this.repo.find({ where, order: { deptName: 'ASC' } });
  }

  async findOne(id: string) {
    const dept = await this.repo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(`部门 ${id} 不存在`);
    return dept;
  }

  async create(body: { id: string; deptName: string; parentId?: string; leader?: string; phone?: string }) {
    const record = this.repo.create(body);
    return this.repo.save(record);
  }

  async update(id: string, body: Partial<Dept>) {
    const result = await this.repo.update(id, body);
    if (result.affected === 0) throw new NotFoundException(`部门 ${id} 不存在`);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`部门 ${id} 不存在`);
    return { success: true };
  }
}