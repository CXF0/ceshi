import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinPaymentsService } from './fin-payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('fin-payments')
@UseGuards(JwtAuthGuard)
export class FinPaymentsController {
  constructor(private readonly service: FinPaymentsService) {}

  /** GET /fin-payments?contractId=xxx  按合同查询回款列表 */
  @Get()
  async findByContract(@Query('contractId') contractId: number) {
    const data = await this.service.findByContract(Number(contractId));
    return { code: 200, data, message: 'success' };
  }

  /** GET /fin-payments/summary?contractId=xxx  回款汇总（用于合同详情页） */
  @Get('summary')
  async getSummary(@Query('contractId') contractId: number) {
    const data = await this.service.getSummaryByContract(Number(contractId));
    return { code: 200, data, message: 'success' };
  }

  /** POST /fin-payments  新增回款阶段 */
  @Post()
  async create(@Body() body: any) {
    const data = await this.service.create(body);
    return { code: 200, data, message: '创建成功' };
  }

  /** PUT /fin-payments/:id  更新（标记收款/开票） */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.service.update(id, body);
    return { code: 200, data, message: '更新成功' };
  }

  /** DELETE /fin-payments/:id */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { code: 200, message: '删除成功' };
  }
}