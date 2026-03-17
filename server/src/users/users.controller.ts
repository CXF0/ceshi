import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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

  @Get('org-tree')
@UseGuards(JwtAuthGuard)
async getOrgTree() {
  // 调用你刚刚在 UsersService 里写的那个 getOrgTree 方法
  const tree = await this.usersService.getOrgTree();
  return tree;
}

  // 后续可以增加：更新资料、修改头像等接口
  // @Post('update')
  // async updateProfile(@Body() updateDto: any) { ... }
}