/**
 * @file server/src/crm/crm.service.ts
 * @version 2.0.0 [2026-04-28]
 * @desc remove 改为软删除；新增 updateStatus；findAll 支持 status 筛选
 */
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmCustomer } from './crm-customer.entity';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CrmCustomer)
    private readonly customerRepo: Repository<CrmCustomer>,
  ) {}

  async findAll(
    user: { deptId: number; roleKey: string },
    query: {
      name?: string;
      source?: string;
      industry?: string;
      level?: string;
      status?: number;   // ← 新增：支持按状态筛选
      page?: number;
      pageSize?: number;
    },
  ) {
    const { name, source, industry, level, page = 1, pageSize = 10 } = query;
    // status 未传时默认只查正常客户（status=1）
    const status = query.status !== undefined ? Number(query.status) : 1;

    const qb = this.customerRepo.createQueryBuilder('customer');

    // 权限隔离
    if (user.roleKey !== 'admin') {
      qb.andWhere('customer.deptId = :deptId', { deptId: user.deptId.toString() });
    }

    // 状态筛选（-1 表示全部，包含禁用）
    if (status !== -1) {
      qb.andWhere('customer.status = :status', { status });
    }

    if (name)     qb.andWhere('customer.name LIKE :name', { name: `%${name}%` });
    if (source)   qb.andWhere('customer.source = :source', { source });
    if (industry) qb.andWhere('customer.industry = :industry', { industry });
    if (level)    qb.andWhere('customer.level = :level', { level });

    qb.leftJoinAndSelect('customer.accounts', 'account');
    qb.orderBy('customer.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOne(id: number, user: { deptId: number; roleKey: string }) {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['accounts'],
    });
    if (!customer) throw new NotFoundException('客户不存在');
    if (user.roleKey !== 'admin' && customer.deptId.toString() !== user.deptId.toString()) {
      throw new ForbiddenException('无权查看该客户资料');
    }
    return customer;
  }

  async create(user: { deptId: number }, data: Partial<CrmCustomer>) {
    const newCustomer = this.customerRepo.create({
      ...data,
      deptId: user.deptId.toString(),
    });
    return this.customerRepo.save(newCustomer);
  }

  async update(id: number, user: { deptId: number; roleKey: string }, data: Partial<CrmCustomer>) {
    const customer = await this.findOne(id, user);
    Object.assign(customer, data);
    return this.customerRepo.save(customer);
  }

  /**
   * 切换客户状态（启用/禁用）
   */
  async updateStatus(id: number, user: { deptId: number; roleKey: string }, status: number) {
    const customer = await this.findOne(id, user);
    customer.status = status;
    return this.customerRepo.save(customer);
  }

  /**
   * 软删除：设置 deleted_at 时间戳
   * TypeORM softRemove 会自动写入 deleted_at，后续查询自动过滤
   */
  async remove(id: number, user: { deptId: number; roleKey: string }) {
    const customer = await this.findOne(id, user);
    return this.customerRepo.softRemove(customer);
  }
}