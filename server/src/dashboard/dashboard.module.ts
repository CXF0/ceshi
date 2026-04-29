/**
 * @file server/src/dashboard/dashboard.module.ts
 * @version 2.0.0 [2026-04-29]
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CrmContract } from '../contract/entities/contract.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { Dept } from '../dept/dept.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmContract, Certificate, Dept, User]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}