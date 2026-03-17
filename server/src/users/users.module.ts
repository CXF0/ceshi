import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller'; // 👈 引入新控制器
import { UsersService } from './users.service';
import { Role } from '../role/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])], // 关键：在此模块注册实体 Repository
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // 导出给 AuthModule 等其他模块使用
})
export class UsersModule {}