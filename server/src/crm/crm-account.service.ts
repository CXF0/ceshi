import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmCustomerAccount } from './crm-customer-account.entity';

@Injectable()
export class CrmAccountService {
  constructor(
    @InjectRepository(CrmCustomerAccount)
    private readonly accountRepo: Repository<CrmCustomerAccount>,
  ) {}

  /**
   * 💡 关键修正：显式声明返回类型为 Promise<CrmCustomerAccount>
   * 这样 Controller 里的 account.customerId 才不会报错
   */
  async findByAccountId(id: number): Promise<CrmCustomerAccount> {
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('该账户记录不存在');
    }
    return account;
  }

  /**
   * 新增财务账户
   * 包含逻辑：如果设为默认，则取消该客户下其他账户的默认状态
   */
  async create(data: Partial<CrmCustomerAccount>): Promise<CrmCustomerAccount> {
    if (!data.customerId) {
      throw new BadRequestException('必须指定关联的客户ID');
    }

    // 💡 逻辑处理：如果当前设为默认账户，先将该客户下的所有账户设为非默认
    if (data.isDefault) {
      await this.accountRepo.update(
        { customerId: data.customerId },
        { isDefault: false },
      );
    }

    const newAccount = this.accountRepo.create(data);
    return this.accountRepo.save(newAccount);
  }

  /**
   * 获取客户的所有账户（按默认和创建时间排序）
   */
  async findByCustomer(customerId: number): Promise<CrmCustomerAccount[]> {
    return this.accountRepo.find({
      where: { customerId },
      order: { 
        isDefault: 'DESC', 
        createdAt: 'DESC' 
      },
    });
  }

  /**
   * 更新账户信息
   */
  async update(id: number, data: Partial<CrmCustomerAccount>): Promise<CrmCustomerAccount> {
    const account = await this.findByAccountId(id);

    // 💡 逻辑处理：如果更新为默认账户，重置同客户下的其他账户
    if (data.isDefault && !account.isDefault) {
      await this.accountRepo.update(
        { customerId: account.customerId },
        { isDefault: false },
      );
    }

    Object.assign(account, data);
    return this.accountRepo.save(account);
  }

  /**
   * 设置默认账户 (快捷切换操作)
   */
  async setDefault(id: number): Promise<CrmCustomerAccount> {
    const account = await this.findByAccountId(id);

    // 全量重置该客户下的账户为非默认
    await this.accountRepo.update(
      { customerId: account.customerId },
      { isDefault: false },
    );

    // 设为默认
    account.isDefault = true;
    return this.accountRepo.save(account);
  }

  /**
   * 删除账户
   */
  async remove(id: number): Promise<CrmCustomerAccount> {
    const account = await this.findByAccountId(id);
    return this.accountRepo.remove(account);
  }
}