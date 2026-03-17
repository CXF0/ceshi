import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ContractModule } from './contract/contract.module';
import { CrmModule } from './crm/crm.module'; // 引入你的新 CRM 模块
import { UploadController } from './common/upload.controller';
import { InstitutionsModule } from './institutions/institution.module';
import { CertTypesModule } from './cert-types/cert-types.module';
import { CertificatesModule } from './certificates/certificates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // 1. 数据库基础配置
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '121.43.138.82',
      port: 3306,
      username: 'www_zhengdatong',
      password: 'Chenzi@911',
      database: 'www_zhengdatong',
      // 💡 建议改成自动扫描，这样你加了 CrmCustomer 实体不用手动在这里注册
      entities: [__dirname + '/**/*.entity{.ts,.js}'], 
      synchronize: false, 
      logging: true,
      timezone: '+08:00',
      connectorPackage: 'mysql2',
    }),

    // 2. 业务功能模块挂载
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
  // 3. 💡 控制器必须放在这里！
  controllers: [
    UploadController, 
  ],
})
export class AppModule {}