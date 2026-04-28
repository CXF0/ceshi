/**
 * @file server/src/role/role.entity.ts
 * @version 2.1.0 [2026-04-28]
 * @desc 将 permissions 从 simple-json 改为 text，避免 TypeORM 版本兼容问题
 */
import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, ManyToMany,
  AfterLoad, BeforeInsert, BeforeUpdate,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('sys_roles')
export class Role {
  @PrimaryGeneratedColumn({ comment: '角色ID' })
  id: number;

  @Column({ name: 'role_name', length: 50, comment: '角色名称' })
  roleName: string;

  @Column({ name: 'role_key', unique: true, length: 50, comment: '角色标识' })
  roleKey: string;

  @Column({ default: 1, comment: '状态：1-正常，0-禁用' })
  status: number;

  @Column({ nullable: true, comment: '描述' })
  description: string;

  /**
   * 数据库存储列：TEXT 类型，存 JSON 字符串
   * 不直接暴露给外部，通过 permissions 虚字段读写
   */
  @Column({ name: 'permissions', type: 'text', nullable: true, comment: '权限 key 数组（JSON）' })
  permissionsRaw: string;

  /** 虚字段：对外暴露为数组 */
  permissions: string[];

  @AfterLoad()
  parsePermissions() {
    try {
      this.permissions = this.permissionsRaw
        ? JSON.parse(this.permissionsRaw)
        : [];
    } catch {
      this.permissions = [];
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  serializePermissions() {
    if (Array.isArray(this.permissions)) {
      this.permissionsRaw = JSON.stringify(this.permissions);
    }
  }

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}