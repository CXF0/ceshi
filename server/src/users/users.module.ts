import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport'; // 💡 必须引入这个
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role,]),
    forwardRef(() => AuthModule),
    // 💡 关键修复：导入 PassportModule 并注册默认策略为 'jwt'
    // 这让 UsersController 能够正确触发 JwtStrategy 的 validate 逻辑
    PassportModule.register({ defaultStrategy: 'jwt' }), 
    
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}