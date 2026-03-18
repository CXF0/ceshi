import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** 管理端：列表查询 */
  @Get()
  async findAll(@Query() query: any) {
    const data = await this.notificationsService.findAll(query);
    return { code: 200, data, message: 'success' };
  }

  /** 用户端：获取我的通知 */
  @Get('my')
  async getMyNotifications() {
    // 模拟从 Token 获取用户信息，实际开发中请使用 @User() 装饰器
    const mockUser = { userId: 1, deptId: 100, roleKey: 'admin' };
    const data = await this.notificationsService.getMyNotifications(mockUser);
    return { code: 200, data, message: 'success' };
  }

  /** 获取详情 */
  @Get('detail/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notificationsService.getDetail(id);
    return { code: 200, data, message: 'success' };
  }

  /** 新增 */
  @Post()
  async create(@Body() data: any) {
    const result = await this.notificationsService.save(data);
    return { code: 200, data: result, message: '创建成功' };
  }

  /** 修改 */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const result = await this.notificationsService.save({ ...data, id });
    return { code: 200, data: result, message: '更新成功' };
  }

  /** 更新状态 (发布/撤回) */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number, 
    @Body('status') status: number
  ) {
    await this.notificationsService.updateStatus(id, status);
    return { code: 200, message: '操作成功' };
  }

  /** 删除 */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.remove(id);
    return { code: 200, message: '删除成功' };
  }
  // server/src/modules/system/notifications.controller.ts

/** 点赞/取消点赞 (对应前端的 /notifications/like/:id) */
@Post('like/:id')
async toggleLike(
  @Param('id', ParseIntPipe) id: number,
  @Body('isLike') isLike: boolean
) {
  // 调用 service 中的点赞逻辑
  const data = await this.notificationsService.toggleLike(id, isLike);
  return { code: 200, data, message: '操作成功' };
}
}