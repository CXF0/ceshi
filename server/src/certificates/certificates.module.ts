import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
// 💡 导入关联模块，以便在 Service 中进行跨表校验或使用其 Repository
import { InstitutionsModule } from '../institutions/institution.module';
import { CertTypesModule } from '../cert-types/cert-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate]),
    InstitutionsModule,
    CertTypesModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}