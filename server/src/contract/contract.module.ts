import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { CrmContract } from './entities/contract.entity';
import { Dept } from '../dept/dept.entity'; // ← 新增

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmContract, Dept]), // ← 加入 Dept
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}