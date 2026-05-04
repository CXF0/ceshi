import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { SiteService } from './site.service';
import { SiteServiceItem } from './entities/site-service.entity';
import { SiteCase } from './entities/site-case.entity';

@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  // ─── Config ───────────────────────────────────────────────

  /** GET /api/site/config — 公开，官网前台读取 */
  @Get('config')
  async getConfig() {
    const data = await this.siteService.getConfig();
    return { code: 200, data };
  }

  /** POST /api/site/config — 后台保存配置（生产环境加 JwtAuthGuard） */
  @Post('config')
  async saveConfig(@Body() body: Record<string, any>) {
    await this.siteService.saveConfig(body);
    return { code: 200, message: '保存成功' };
  }

  // ─── Services ─────────────────────────────────────────────

  /** GET /api/site/services?all=1 — all=1 时后台全量返回，否则只返回 is_active=1 */
  @Get('services')
  async getServices(@Query('all') all: string) {
    const data = await this.siteService.getServices(all !== '1');
    return { code: 200, data };
  }

  @Post('services')
  async createService(@Body() body: Partial<SiteServiceItem>) {
    const data = await this.siteService.createService(body);
    return { code: 200, data };
  }

  @Put('services/:id')
  async updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<SiteServiceItem>,
  ) {
    const data = await this.siteService.updateService(id, body);
    return { code: 200, data };
  }

  @Delete('services/:id')
  async deleteService(@Param('id', ParseIntPipe) id: number) {
    await this.siteService.deleteService(id);
    return { code: 200, message: '已删除' };
  }

  // ─── Cases ────────────────────────────────────────────────

  @Get('cases')
  async getCases(@Query('all') all: string) {
    const data = await this.siteService.getCases(all !== '1');
    return { code: 200, data };
  }

  @Post('cases')
  async createCase(@Body() body: Partial<SiteCase>) {
    const data = await this.siteService.createCase(body);
    return { code: 200, data };
  }

  @Put('cases/:id')
  async updateCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<SiteCase>,
  ) {
    const data = await this.siteService.updateCase(id, body);
    return { code: 200, data };
  }

  @Delete('cases/:id')
  async deleteCase(@Param('id', ParseIntPipe) id: number) {
    await this.siteService.deleteCase(id);
    return { code: 200, message: '已删除' };
  }
}