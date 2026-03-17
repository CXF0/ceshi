import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { CrmContract } from './entities/contract.entity';

@Module({
  imports: [
    // 💡 注册 Entity，否则 Service 无法注入 Repository
    TypeOrmModule.forFeature([CrmContract])
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}