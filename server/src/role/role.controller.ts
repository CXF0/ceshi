/**
 * @file server/src/role/role.controller.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 角色 Controller - 补全 CRUD 接口
 */
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('role')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /** 获取全部角色列表（管理端，含禁用） GET /api/role/list */
  @Get('list')
  async getList() {
    const data = await this.roleService.findAll();
    return { code: 200, data, msg: 'ok' };
  }

  /** 获取启用角色（用于用户编辑下拉框） GET /api/role/active */
  @Get('active')
  async getActive() {
    const data = await this.roleService.findActive();
    return { code: 200, data, msg: 'ok' };
  }

  /** 新增角色 POST /api/role */
  @Post()
  async create(@Body() dto: any) {
    const data = await this.roleService.create(dto);
    return { code: 200, data, msg: '创建成功' };
  }

  /** 更新角色 PUT /api/role/:id */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    const data = await this.roleService.update(id, dto);
    return { code: 200, data, msg: '更新成功' };
  }

  /** 删除角色 DELETE /api/role/:id */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.roleService.remove(id);
    return { code: 200, msg: '删除成功' };
  }
}