import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SiteContentService } from './site-content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('site-content')
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  @Get('public')
  async getPublic() {
    const data = await this.service.getPublic();
    return { code: 200, data, message: 'success' };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAdmin() {
    const data = await this.service.getAdmin();
    return { code: 200, data, message: 'success' };
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Body() body: any, @Req() req: any) {
    const content = body?.content ?? body;
    const updatedBy = req?.user?.id ?? null;
    const data = await this.service.update(content, updatedBy);
    return { code: 200, data, message: '保存成功' };
  }
}

