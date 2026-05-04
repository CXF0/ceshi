/**
 * @file server/src/notifications/notifications.controller.ts
 * @version 2.2.0 [2026-05-04]
 * @desc 修复：
 *   1. GET /my 移除 mockUser，改为透传 req.user（需 JwtAuthGuard）
 *   2. 鉴权策略：公告列表/详情无需登录，管理操作和用户相关接口需要登录
 */
import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ── 公开接口（无需 JWT）─────────────────────────────────

  /** 管理端/用户端：公告列表 */
  @Get()
  async findAll(@Query() query: any) {
    const data = await this.notificationsService.findAll(query);
    return { code: 200, data, message: 'success' };
  }

  /** 公告详情 */
  @Get('detail/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notificationsService.getDetail(id);
    return { code: 200, data, message: 'success' };
  }

  // ── 需要登录的接口 ──────────────────────────────────────

  /**
   * 用户端：获取我的通知（当前用户可见范围）
   * ✅ 修复：透传 req.user，不再使用 mockUser
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(@Req() req: any) {
    const data = await this.notificationsService.getMyNotifications(req.user);
    return { code: 200, data, message: 'success' };
  }

  /** 查询当前用户是否已点赞 */
  @Get(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async getLikeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const liked = await this.notificationsService.getLikeStatus(id, req.user.userId);
    return { code: 200, data: { liked }, message: 'success' };
  }

  /** 点赞 / 取消点赞 */
  @Post('like/:id')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const data = await this.notificationsService.toggleLike(id, req.user.userId);
    return { code: 200, data, message: '操作成功' };
  }

  /** 新增公告 */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: any) {
    const result = await this.notificationsService.save(data);
    return { code: 200, data: result, message: '创建成功' };
  }

  /** 编辑公告 */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const result = await this.notificationsService.save({ ...data, id });
    return { code: 200, data: result, message: '更新成功' };
  }

  /** 更新状态（发布 / 撤回） */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    await this.notificationsService.updateStatus(id, status);
    return { code: 200, message: '操作成功' };
  }

  /** 删除公告 */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.remove(id);
    return { code: 200, message: '删除成功' };
  }
}