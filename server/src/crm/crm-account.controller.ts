import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CrmService } from './crm.service';

@Controller('crm/customer-accounts')
@UseGuards(JwtAuthGuard)
export class CrmAccountController {
  constructor(private readonly crmService: CrmService) {}

  /**
   * 创建客户账户逻辑
   * 修复了 data.customerId 可能为 undefined 的类型冲突
   */
  @Post()
  async create(@Body() data: any, @Req() req) {
    // 1. 显式逻辑守卫：防止 undefined 或 null 传入 findOne
    if (!data.customerId) {
      throw new BadRequestException('关联客户 ID (customerId) 不能为空');
    }

    // 2. 强制转换并执行：确保传给 Service 的是 number
    // 同时也通过此判断让 TS 编译器知道此处 customerId 必定存在
    try {
      const customerId = Number(data.customerId);
      return await this.crmService.findOne(customerId, req.user);
    } catch (error) {
      // 捕获 Service 层抛出的 NotFoundException 或 ForbiddenException
      throw error;
    }
  }
}