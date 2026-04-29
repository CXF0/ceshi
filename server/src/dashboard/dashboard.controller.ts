/**
 * @file server/src/dashboard/dashboard.controller.ts
 * @version 3.0.0 [2026-04-29]
 */
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(
    @Req() req: any,
    @Query('period') period: string = 'month',   // month | quarter | year
    @Query('salesUserId') salesUserId?: string,  // 销售人员筛选
  ) {
    const data = await this.dashboardService.getSummary(req.user, { period, salesUserId });
    return { code: 200, message: 'success', data };
  }
}