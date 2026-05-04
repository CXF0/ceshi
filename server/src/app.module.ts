/**
 * @file server/src/app.module.ts
 * @version 2.2.0 [2026-05-04]
 * @desc 新增 SiteModule，提供 /api/site/* 官网管理接口
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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
import { RoleModule } from './role/role.module';
import { DeptModule } from './dept/dept.module';
import { FinPaymentsModule } from './fin-payments/fin-payments.module';
import { SiteModule } from './site/site.module'; 
import { InquiryModule } from './inquiry/inquiry.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

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

    AuthModule,
    UsersModule,
    RoleModule,
    DeptModule,
    CrmModule,
    ContractModule,
    FinPaymentsModule,
    InstitutionsModule,
    CertTypesModule,
    CertificatesModule,
    DashboardModule,
    NotificationsModule,
    SiteModule, 
    InquiryModule,
  ],
  controllers: [
    UploadController,
  ],
})
export class AppModule {}