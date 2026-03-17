import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CertTypesService } from './cert-types.service';

@Controller('cert-types')
export class CertTypesController {
  constructor(private readonly service: CertTypesService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.service.findAll(query);
    return { code: 200, data, message: 'success' };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.service.create(body);
    return { code: 200, data, message: '创建成功' };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    await this.service.update(+id, body);
    return { code: 200, message: '更新成功' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { code: 200, message: '删除成功' };
  }
}