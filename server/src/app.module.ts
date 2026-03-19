import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // 💡 1. 引入调度模块
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ContractModule } from './contract/contract.module';
import { CrmModule } from './crm/crm.module';
import { UploadController } from './common/upload.controller';
import { InstitutionsModule } from './institutions/institution.module';
import { CertTypesModule } from './cert-types/cert-types.module';
import { CertificatesModule } from './certificates/certificates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // 💡 2. 启用定时任务调度器 (必须调用 forRoot)
    ScheduleModule.forRoot(),

    // 数据库基础配置
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '121.43.138.82',
      port: 3306,
      username: 'www_zhengdatong',
      password: 'Chenzi@911',
      database: 'www_zhengdatong',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], 
      synchronize: false, 
      logging: true,
      timezone: '+08:00',
      connectorPackage: 'mysql2',
    }),

    // 业务功能模块
    AuthModule,
    UsersModule,
    CrmModule,
    ContractModule,
    InstitutionsModule,
    CertTypesModule,
    CertificatesModule,
    DashboardModule,
    NotificationsModule,
  ],
  controllers: [
    UploadController, 
  ],
})
export class AppModule {}