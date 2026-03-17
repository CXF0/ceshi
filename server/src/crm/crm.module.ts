import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { CrmCustomer } from './crm-customer.entity';

@Module({
  imports: [
    // 显式声明该模块使用的实体
    TypeOrmModule.forFeature([CrmCustomer])
  ],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService], // 导出后，其他模块也能引用它的逻辑
})
export class CrmModule {}