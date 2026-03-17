import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationType } from './entities/cert-type.entity';
import { CertTypesService } from './cert-types.service';
import { CertTypesController } from './cert-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CertificationType])],
  controllers: [CertTypesController],
  providers: [CertTypesService],
  // 💡 导出以便在证书录入时校验类型是否存在或直接关联
  exports: [CertTypesService, TypeOrmModule], 
})
export class CertTypesModule {}