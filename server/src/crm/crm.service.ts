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

  /**
   * 获取客户列表（带权限过滤与分页）
   */
  async findAll(
    user: { deptId: number; roleKey: string }, 
    query: { 
      name?: string; 
      source?: string; 
      industry?: string; 
      level?: string; 
      page?: number; 
      pageSize?: number 
    }
  ) {
    const { name, source, industry, level, page = 1, pageSize = 10 } = query;
    const qb = this.customerRepo.createQueryBuilder('customer');

    // 1. 权限隔离：非管理员只能看本部门数据
    if (user.roleKey !== 'admin') {
      qb.andWhere('customer.deptId = :deptId', { deptId: user.deptId.toString() });
    }

    // 2. 关键词搜索
    if (name) {
      qb.andWhere('customer.name LIKE :name', { name: `%${name}%` });
    }

    // 3. 来源筛选
    if (source) {
      qb.andWhere('customer.source = :source', { source });
    }

    // 4. 行业筛选
    if (industry) {
      qb.andWhere('customer.industry = :industry', { industry });
    }

    // 5. 客户等级筛选
    if (level) {
      qb.andWhere('customer.level = :level', { level });
    }

    // 关联查询账户信息
    qb.leftJoinAndSelect('customer.accounts', 'account');

    // 6. 分页与排序
    qb.orderBy('customer.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: Number(page), pageSize: Number(pageSize) };
  }

  /**
   * 获取单个客户详情（带权限检查并加载账户信息）
   */
  async findOne(id: number, user: { deptId: number; roleKey: string }) {
    const customer = await this.customerRepo.findOne({ 
      where: { id },
      relations: ['accounts'], 
    });
    
    if (!customer) throw new NotFoundException('客户不存在');
    
    // 🔐 横向越权检查：统一转为字符串进行安全比较
    if (user.roleKey !== 'admin' && customer.deptId.toString() !== user.deptId.toString()) {
      throw new ForbiddenException('你无权查看该分公司的客户资料');
    }
    
    return customer;
  }

  /**
   * 新增客户
   */
  async create(user: { deptId: number }, data: Partial<CrmCustomer>) {
    const newCustomer = this.customerRepo.create({
      ...data,
      deptId: user.deptId.toString(), 
    });
    return this.customerRepo.save(newCustomer);
  }

  /**
   * 更新客户
   */
  async update(id: number, user: { deptId: number; roleKey: string }, data: Partial<CrmCustomer>) {
    const customer = await this.findOne(id, user); 
    Object.assign(customer, data); 
    return this.customerRepo.save(customer);
  }

  /**
   * 删除客户
   */
  async remove(id: number, user: { deptId: number; roleKey: string }) {
    const customer = await this.findOne(id, user);
    return this.customerRepo.remove(customer);
  }
}