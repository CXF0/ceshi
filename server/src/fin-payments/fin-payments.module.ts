/**
 * @file server/src/fin-payments/fin-payments.module.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 补充引入 CrmContract，供 FinPaymentsService.create 自动取 deptId
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinPayment } from './fin-payment.entity';
import { CrmContract } from '../contract/entities/contract.entity';
import { FinPaymentsService } from './fin-payments.service';
import { FinPaymentsController } from './fin-payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinPayment, CrmContract]), // ← 补充 CrmContract
  ],
  controllers: [FinPaymentsController],
  providers: [FinPaymentsService],
  exports: [FinPaymentsService],
})
export class FinPaymentsModule {}