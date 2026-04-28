/**
 * @file server/src/dept/dept.module.ts
 * @desc 修复：TypeOrmModule.forFeature([Dept]) 补全，解决 DeptRepository 注入失败
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';
import { Dept } from './dept.entity';   // ← 按你实际实体文件名调整

@Module({
  imports: [
    TypeOrmModule.forFeature([Dept]),   // ← 这行是关键，注册实体才能注入 Repository
  ],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}