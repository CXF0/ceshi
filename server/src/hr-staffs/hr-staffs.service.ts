import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { HrStaff } from './hr-staff.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HrStaffsService {
  constructor(
    @InjectRepository(HrStaff)
    private readonly repo: Repository<HrStaff>,
  ) {}

  async findAll(query: { deptId?: string; name?: string; staffType?: string; status?: string }) {
    const qb = this.repo.createQueryBuilder('s');
    if (query.deptId) qb.andWhere('s.deptId = :deptId', { deptId: query.deptId });
    if (query.name) qb.andWhere('s.name LIKE :name', { name: `%${query.name}%` });
    if (query.staffType) qb.andWhere('s.staffType = :staffType', { staffType: query.staffType });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    return qb.orderBy('s.name', 'ASC').getMany();
  }

  async findOne(id: string) {
    const staff = await this.repo.findOne({ where: { id } });
    if (!staff) throw new NotFoundException(`人员 ${id} 不存在`);
    return staff;
  }

  async create(body: Partial<HrStaff>) {
    const record = this.repo.create({ ...body, id: uuidv4() });
    return this.repo.save(record);
  }

  async update(id: string, body: Partial<HrStaff>) {
    await this.findOne(id);
    await this.repo.update(id, body);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { success: true };
  }
}