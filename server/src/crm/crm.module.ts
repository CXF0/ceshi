import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { CrmCustomer } from './crm-customer.entity';
import { CrmCustomerAccount } from './crm-customer-account.entity';
import { CrmAccountService } from './crm-account.service';
import { CrmAccountController } from './crm-account.controller';
import { Dept } from '../dept/dept.entity'; // ← 新增

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmCustomer, CrmCustomerAccount, Dept]), // ← 加入 Dept
  ],
  controllers: [CrmController, CrmAccountController],
  providers: [CrmService, CrmAccountService],
  exports: [CrmService, CrmAccountService],
})
export class CrmModule {}