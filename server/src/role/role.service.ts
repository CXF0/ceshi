import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // 获取所有启用的角色列表
  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      where: { status: 1 },
      order: { id: 'ASC' }
    });
  }
}