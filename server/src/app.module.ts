/**
 * @file server/src/app.module.ts
 * @version 2.3.0 [2026-05-05]
 * @desc 使用环境变量管理数据库配置，移除硬编码敏感信息
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

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

@Module({
  imports: [
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: getRequiredEnv('DB_HOST'),
      port: Number(process.env.DB_PORT || 3306),
      username: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASS'),
      database: getRequiredEnv('DB_NAME'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      timezone: process.env.DB_TIMEZONE || '+08:00',
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
  controllers: [UploadController],
})
export class AppModule {}
