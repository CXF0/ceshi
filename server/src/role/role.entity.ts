import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany } from 'typeorm';
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

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}