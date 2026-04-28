import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinPayment } from './fin-payment.entity';
import { FinPaymentsService } from './fin-payments.service';
import { FinPaymentsController } from './fin-payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FinPayment])],
  controllers: [FinPaymentsController],
  providers: [FinPaymentsService],
  exports: [FinPaymentsService],
})
export class FinPaymentsModule {}