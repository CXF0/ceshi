/**
 * @file server/src/crm/crm.controller.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 新增 PATCH /:id/status 接口，支持启用/禁用客户
 */
import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards, Req, ParseIntPipe,BadRequestException,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmCustomer } from './crm-customer.entity';

@Controller('crm/customers')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    return this.crmService.findAll(req.user, {
      ...query,
      page:     Number(query.page)     || 1,
      pageSize: Number(query.pageSize) || 10,
      status:   query.status !== undefined ? Number(query.status) : undefined,
    });
  }

  @Post()
  async create(@Req() req: any, @Body() customerData: Partial<CrmCustomer>) {
    return this.crmService.create(req.user, customerData);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() updateDto: any,
  ) {
    return this.crmService.update(id, req.user, updateDto);
  }

  /** 切换状态：PATCH /api/crm/customers/:id/status */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('status') status: number,
  ) {
    return this.crmService.updateStatus(id, req.user, status);
  }

  @Post(':id/maintenances')
  async addMaintenance(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('content') content: string,
  ) {
    const normalizedContent = (content || '').trim();
    if (!normalizedContent) throw new BadRequestException('维护内容不能为空');
    return this.crmService.addMaintenance(id, req.user, normalizedContent);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.crmService.findOne(id, req.user);
  }

  /** 软删除：DELETE /api/crm/customers/:id */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.crmService.remove(id, req.user);
    return { code: 200, message: '删除成功' };
  }
}