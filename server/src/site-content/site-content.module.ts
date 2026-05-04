import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteContent } from './site-content.entity';
import { SiteContentService } from './site-content.service';
import { SiteContentController } from './site-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContent])],
  controllers: [SiteContentController],
  providers: [SiteContentService],
  exports: [SiteContentService],
})
export class SiteContentModule {}

