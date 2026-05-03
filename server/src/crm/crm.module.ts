import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { CrmCustomer } from './crm-customer.entity';
import { CrmCustomerAccount } from './crm-customer-account.entity';
import { CrmAccountService } from './crm-account.service';
import { CrmAccountController } from './crm-account.controller';
import { Dept } from '../dept/dept.entity'; 
import { CrmCustomerMaintenance } from './crm-customer-maintenance.entity'; // ← 新增

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmCustomer, CrmCustomerAccount, Dept, CrmCustomerMaintenance]), // ← 加入 Dept 和 CrmCustomerMaintenance
  ],
  controllers: [CrmController, CrmAccountController],
  providers: [CrmService, CrmAccountService],
  exports: [CrmService, CrmAccountService],
})
export class CrmModule {}