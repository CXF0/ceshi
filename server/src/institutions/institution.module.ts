import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from './entities/institution.entity';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Institution])
  ],
  controllers: [InstitutionController],
  providers: [InstitutionService],
  // 💡 导出 Service，以便证书模块或其他模块可以引用机构数据
  exports: [InstitutionService, TypeOrmModule] 
})
export class InstitutionsModule {}