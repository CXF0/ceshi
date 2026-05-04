/**
 * @file server/src/users/users.module.ts
 * @version 1.1.0 [2026-05-04]
 * @desc 补充 Dept entity 注册，供 getOrgTree 使用
 */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { Dept } from '../dept/dept.entity';   // ← 新增
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Dept]),   // ← 补充 Dept
    forwardRef(() => AuthModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}