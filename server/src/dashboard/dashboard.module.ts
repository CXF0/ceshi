import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
// 💡 确保实体导入路径与你实际文件位置一致
import { CrmContract } from '../contract/entities/contract.entity';
import { CertificationType } from '../cert-types/entities/cert-type.entity';

@Module({
  imports: [
    // 💡 关键：这里必须包含 CrmContract，Nest 才能生成 CrmContractRepository
    TypeOrmModule.forFeature([CrmContract, CertificationType]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  // 如果其他模块需要用到 DashboardService，可以 export 它
  exports: [DashboardService],
})
export class DashboardModule {}