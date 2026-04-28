import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { CrmCustomer } from './crm-customer.entity';
import { CrmCustomerAccount } from './crm-customer-account.entity';
import { CrmAccountService } from './crm-account.service';
import { CrmAccountController } from './crm-account.controller';

/**
 * ⚠️ 原代码修正：
 * - 原 Module 只注册了 CrmCustomer，缺少 CrmCustomerAccount
 * - crm-account.controller.ts 错误地注入了 CrmService 而非 CrmAccountService
 * - 这里统一将两个 Entity 和两个 Service 都注册进来
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CrmCustomer, CrmCustomerAccount]),
  ],
  controllers: [CrmController, CrmAccountController],
  providers: [CrmService, CrmAccountService],
  exports: [CrmService, CrmAccountService],
})
export class CrmModule {}