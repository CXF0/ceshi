/**
 * @file server/src/crm/crm.service.ts
 * @version 3.2.0 [2026-04-28]
 * @desc dept_id 为 string；leftJoinAndSelect dept；数据隔离
 */
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmCustomer } from './crm-customer.entity';
import { Dept } from '../dept/dept.entity';
import { getDeptScope } from '../common/dept-scope.util';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CrmCustomer)
    private readonly customerRepo: Repository<CrmCustomer>,
    @InjectRepository(Dept)
    private readonly deptRepo: Repository<Dept>,
  ) {}

  async findAll(
    user: { deptId: string | number; roleKey: string },
    query: {
      name?: string; source?: string; industry?: string;
      level?: string; status?: number;
      deptId?: string;
      page?: number; pageSize?: number;
    },
  ) {
    const { name, source, industry, level } = query;
    const status       = query.status !== undefined ? Number(query.status) : 1;
    const page         = Number(query.page)     || 1;
    const pageSize     = Number(query.pageSize) || 10;
    const filterDeptId = query.deptId ? String(query.deptId) : undefined;

    const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);

    const qb = this.customerRepo.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.accounts', 'account')
      .leftJoinAndSelect('customer.dept', 'dept');

    qb.andWhere('customer.deptId IN (:...visibleDeptIds)', { visibleDeptIds });

    if (filterDeptId && visibleDeptIds.includes(filterDeptId)) {
      qb.andWhere('customer.deptId = :filterDeptId', { filterDeptId });
    }

    if (status !== -1) qb.andWhere('customer.status = :status', { status });
    if (name)          qb.andWhere('customer.name LIKE :name', { name: `%${name}%` });
    if (source)        qb.andWhere('customer.source = :source', { source });
    if (industry)      qb.andWhere('customer.industry = :industry', { industry });
    if (level)         qb.andWhere('customer.level = :level', { level });

    qb.orderBy('customer.id', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async findOne(id: number, user: { deptId: string | number; roleKey: string }) {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['accounts', 'dept'],
    });
    if (!customer) throw new NotFoundException('客户不存在');
    const visibleDeptIds = await getDeptScope(this.deptRepo, user.deptId, user.roleKey);
    if (!visibleDeptIds.includes(String(customer.deptId))) {
      throw new ForbiddenException('无权查看该客户资料');
    }
    return customer;
  }

  async create(user: { deptId: string | number }, data: Partial<CrmCustomer>) {
    const newCustomer = this.customerRepo.create({ ...data, deptId: String(user.deptId) });
    return this.customerRepo.save(newCustomer);
  }

  async update(id: number, user: { deptId: string | number; roleKey: string }, data: Partial<CrmCustomer>) {
    const customer = await this.findOne(id, user);
    Object.assign(customer, data);
    return this.customerRepo.save(customer);
  }

  async updateStatus(id: number, user: { deptId: string | number; roleKey: string }, status: number) {
    const customer = await this.findOne(id, user);
    customer.status = status;
    return this.customerRepo.save(customer);
  }

  async remove(id: number, user: { deptId: string | number; roleKey: string }) {
    const customer = await this.findOne(id, user);
    return this.customerRepo.softRemove(customer);
  }
}