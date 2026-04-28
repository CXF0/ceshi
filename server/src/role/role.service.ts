/**
 * @file server/src/role/role.service.ts
 * @version 2.1.0 [2026-04-28]
 * @desc update 方法显式处理 permissions 赋值，确保写入数据库
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ order: { id: 'ASC' } });
  }

  async findActive(): Promise<Role[]> {
    return this.roleRepository.find({ where: { status: 1 }, order: { id: 'ASC' } });
  }

  async create(dto: Partial<Role>): Promise<Role> {
    const exists = await this.roleRepository.findOne({ where: { roleKey: dto.roleKey } });
    if (exists) throw new ConflictException(`角色标识 "${dto.roleKey}" 已存在`);
    const role = this.roleRepository.create(dto);
    // 新增时若携带 permissions，提前序列化
    if (Array.isArray((dto as any).permissions)) {
      role.permissions = (dto as any).permissions;
    }
    return this.roleRepository.save(role);
  }

  async update(id: number, dto: any): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`角色 ID ${id} 不存在`);

    // roleKey 不允许修改，其余字段全量覆盖
    const { roleKey: _rk, permissions, ...rest } = dto;
    Object.assign(role, rest);

    // 显式赋值 permissions，触发 @BeforeUpdate 钩子序列化
    if (Array.isArray(permissions)) {
      role.permissions = permissions;
      role.permissionsRaw = JSON.stringify(permissions); // 双保险：直接写 raw 列
    }

    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id }, relations: ['users'] });
    if (!role) throw new NotFoundException(`角色 ID ${id} 不存在`);
    if (role.users?.length > 0) {
      throw new ConflictException(`该角色已被 ${role.users.length} 名用户使用，请先解除关联`);
    }
    await this.roleRepository.delete(id);
  }
}