import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DeptService } from './dept.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('depts')
@UseGuards(JwtAuthGuard)
export class DeptController {
  constructor(private readonly service: DeptService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.service.findAll(query);
    return { code: 200, data, message: 'success' };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { code: 200, data, message: 'success' };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.service.create(body);
    return { code: 200, data, message: '创建成功' };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.service.update(id, body);
    return { code: 200, data, message: '更新成功' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { code: 200, message: '删除成功' };
  }
}