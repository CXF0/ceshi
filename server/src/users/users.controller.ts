import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')// 定义用户模块的路由前缀
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 获取当前登录用户的信息（包含分公司信息）
  @Get('profile')
  async getProfile(@Req() req) {
    // 这里的 req.user 是由 AuthGuard 验证 Token 后注入的
    const userId = req.user.id; 
    return this.usersService.findOne(userId);
  }

  // 后续可以增加：更新资料、修改头像等接口
  // @Post('update')
  // async updateProfile(@Body() updateDto: any) { ... }
}