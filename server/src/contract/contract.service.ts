import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CrmContract } from './entities/contract.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(CrmContract)
    private readonly contractRepo: Repository<CrmContract>,
  ) {}

  // 1. 分页查询列表 (扩展了搜索参数：认证主体、认证类型、日期范围)
  async findAll(query: any, user: any) {
    const { 
      page = 1, 
      pageSize = 10, 
      contractNo, 
      status, 
      customerName, 
      certType, 
      signedDateStart, 
      signedDateEnd 
    } = query;
    
    const qb = this.contractRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer');

    // 权限控制：非管理员只能看本部门
    if (user.roleKey !== 'admin' && user.deptId) {
      qb.andWhere('contract.deptId = :deptId', { deptId: user.deptId });
    }

    // 1. 合同号模糊搜索
    if (contractNo) {
      qb.andWhere('contract.contractNo LIKE :contractNo', { contractNo: `%${contractNo}%` });
    }

    // 2. 状态搜索
    if (status) {
      qb.andWhere('contract.status = :status', { status });
    }

    // 3. 认证主体 (客户名) 模糊搜索
    if (customerName) {
      qb.andWhere('customer.name LIKE :customerName', { customerName: `%${customerName}%` });
    }

    // 4. 认证类型搜索 (支持选择大类时匹配其下所有子类)
    if (certType) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb.where('contract.certType = :certType', { certType })
            .orWhere(
              'contract.certType IN (SELECT type_code FROM sys_certification_type WHERE parent_code = :certType)',
              { certType },
            );
        }),
      );
    }

    // 5. 签约日期范围搜索
    if (signedDateStart && signedDateEnd) {
      qb.andWhere('contract.signedDate BETWEEN :signedDateStart AND :signedDateEnd', {
        signedDateStart,
        signedDateEnd,
      });
    }

    qb.orderBy('contract.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  // 2. 起草新合同
  async create(body: any, user: any) {
    const newContract = this.contractRepo.create({
      ...body,
      deptId: user.deptId,
      createBy: user.username || user.nickname,
    });

    return await this.contractRepo.save(newContract);
  }

  // 3. 更新合同 (已修复类型冲突)
  async update(id: string | number, body: any) {
    // 💡 修复点：强制指定 where 类型，确保 id 以字符串形式匹配
    const contract = await this.contractRepo.findOne({ 
      where: { id: String(id) } as any 
    });

    if (!contract) {
      throw new NotFoundException(`未找到 ID 为 ${id} 的合同`);
    }

    // 剔除关联对象字段和不可更新字段，防止写入报错
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { customer, id: _, createTime, updateTime, ...updateData } = body;

    const updated = this.contractRepo.merge(contract, updateData);
    return await this.contractRepo.save(updated);
  }

  // 4. 删除合同 (已修复类型冲突)
  async remove(id: string | number) {
    // 💡 修复点：强制指定 where 类型
    const contract = await this.contractRepo.findOne({ 
      where: { id: String(id) } as any 
    });

    if (!contract) {
      throw new NotFoundException(`未找到 ID 为 ${id} 的合同`);
    }
    return await this.contractRepo.remove(contract);
  }
}