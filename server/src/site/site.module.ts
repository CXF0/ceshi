import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfig } from './entities/site-config.entity';
import { SiteServiceItem } from './entities/site-service.entity';
import { SiteCase } from './entities/site-case.entity';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfig, SiteServiceItem, SiteCase])],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}