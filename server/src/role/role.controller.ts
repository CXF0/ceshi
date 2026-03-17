import { Controller, Get } from '@nestjs/common';
import { RoleService } from './role.service';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('list')
  async getList() {
    const data = await this.roleService.findAll();
    return { code: 200, data, msg: 'ok' };
  }
}