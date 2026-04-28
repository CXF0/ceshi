import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // 统一开启 JWT 保护
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

/** 获取当前登录用户资料 */
  @Get('profile')
  async getProfile(@Req() req) {
    // 💡 核心修复：从 req.user 中取出 userId (对应你的 Strategy)
    // 并且使用 Number() 强制转换，确保符合 findById(id: number) 的参数要求
    const userId = Number(req.user.userId); 

    if (!userId) {
      return { code: 400, msg: '无效的用户凭证' };
    }

    const user = await this.usersService.findById(userId);
    
    if (!user) {
      return { code: 404, msg: '用户不存在' };
    }

    return { code: 200, data: user, msg: '获取成功' };
  }

  /** 获取组织架构树 */
  @Get('org-tree')
  async getOrgTree() {
    const tree = await this.usersService.getOrgTree();
    return { code: 200, data: tree, msg: '获取成功' };
  }

  /** 获取用户列表 */
  @Get('list')
  async findAll() {
    const users = await this.usersService.findAll();
    return { code: 200, data: users, msg: '查询成功' };
  }

  /** 新增用户 */
  @Post('create')
  async register(@Body() userData: any) {
    const user = await this.usersService.register(userData);
    return { code: 200, data: user, msg: '创建成功' };
  }

  /** 更新用户 */
  @Post('update')
  async update(@Body() body: any) {
    const { id, ...updateData } = body;
    const user = await this.usersService.update(id, updateData);
    return { code: 200, data: user, msg: '更新成功' };
  }

  /** 删除用户 */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(+id);
    return { code: 200, msg: '删除成功' };
  }
}