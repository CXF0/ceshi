import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccountService } from './crm-account.service';

/**
 * ⚠️ 原代码问题：
 * - 原 crm-account.controller.ts 注入的是 CrmService，并只有 POST 方法
 * - 实际应注入 CrmAccountService，并补全 GET / PUT / PATCH / DELETE
 */
@Controller('crm/customer-accounts')
@UseGuards(JwtAuthGuard)
export class CrmAccountController {
  constructor(private readonly accountService: CrmAccountService) {}

  /** GET /crm/customer-accounts?customerId=1  获取客户的账户列表 */
  @Get()
  async findByCustomer(@Query('customerId', ParseIntPipe) customerId: number) {
    const data = await this.accountService.findByCustomer(customerId);
    return { code: 200, data, message: 'success' };
  }

  /** POST /crm/customer-accounts  新增账户 */
  @Post()
  async create(@Body() data: any) {
    const result = await this.accountService.create(data);
    return { code: 200, data: result, message: '创建成功' };
  }

  /** PUT /crm/customer-accounts/:id  更新账户 */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const result = await this.accountService.update(id, data);
    return { code: 200, data: result, message: '更新成功' };
  }

  /** PATCH /crm/customer-accounts/:id/default  设置默认账户 */
  @Patch(':id/default')
  async setDefault(@Param('id', ParseIntPipe) id: number) {
    const result = await this.accountService.setDefault(id);
    return { code: 200, data: result, message: '已设为默认账户' };
  }

  /** DELETE /crm/customer-accounts/:id  删除账户 */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.accountService.remove(id);
    return { code: 200, message: '删除成功' };
  }
}