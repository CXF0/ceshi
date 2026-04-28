/**
 * @file server/src/role/role.module.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 角色模块 - 导出 RoleService 给 UsersModule 使用
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { Role } from './role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService, TypeOrmModule],  // ← exports TypeOrmModule 让 UsersModule 直接用 Role 仓库
})
export class RoleModule {}