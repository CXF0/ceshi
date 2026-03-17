import { Controller, Get, Req, Post, Body, Param, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/roles.decorator";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // 💡 用户端：获取我的通知（对应前端 GlobalOverview 的请求）
  @Get('my') // 修改为 'my'，与前端 request('/notifications/my') 保持一致
  @UseGuards(JwtAuthGuard) // 必须加守卫，否则 req.user 是空的
  async getMyNotifications(@Req() req) {
    // 这里的 req.user 是从 JwtStrategy 注入的
    return this.notificationsService.getMyNotifications(req.user);
  }

  // 💡 管理端：发布通知
  @Post('publish')
  @UseGuards(JwtAuthGuard) // 建议也加上守卫
  @Roles('admin')
  async publish(@Body() createDto: any) {
    return this.notificationsService.create(createDto);
  }

  // 💡 公共端：查看详情
  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  async getDetail(@Param('id') id: number) {
    return this.notificationsService.getDetail(id);
  }

  // 💡 公共端：点赞
  @Post('like/:id')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('id') id: number, @Body('isLike') isLike: boolean) {
    return this.notificationsService.toggleLike(id, isLike);
  }
}