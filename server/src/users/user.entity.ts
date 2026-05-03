/**
 * @file server/src/users/user.entity.ts
 * @version 2.1.0 [2026-04-29]
 * @desc 补充 hasSalesTarget / salesTarget 业绩目标字段
 */
import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn,
  ManyToMany, JoinTable, AfterLoad,
} from 'typeorm';
import { Role } from '../role/role.entity';

@Entity('sys_users')
export class User {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ unique: true, comment: '登录账号' })
  username: string;

  @Column({ select: false, comment: '密码' })
  password: string;

  @Column({ nullable: true, comment: '用户昵称' })
  nickname: string;

  @Column({ nullable: true, comment: '头像地址' })
  avatar: string;

  @Column({ default: 1, comment: '状态：1-正常，0-禁用' })
  status: number;

  @Column({ nullable: true, comment: '手机号' })
  phone: string;

  @Column({ name: 'dept_id', type: 'char', length: 36, nullable: true, comment: '所属分公司ID' })
  deptId: string;

  /** 是否设定业绩目标 */
  @Column({ name: 'has_sales_target', type: 'tinyint', default: 0, comment: '是否设定业绩目标' })
  hasSalesTarget: number;

  /** 个人月度业绩目标金额（has_sales_target=1 时有效） */
  @Column({
    name: 'sales_target',
    type: 'decimal', precision: 12, scale: 2,
    nullable: true,
    comment: '个人月度业绩目标金额',
    transformer: { to: (v: number) => v, from: (v: string) => v ? parseFloat(v) : null },
  })
  salesTarget: number | null;

  roleKeys:  string[];
  roleNames: string;
  roleKey:   string;
  roleName:  string;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'sys_user_roles',
    joinColumn:        { name: 'user_id',  referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id',  referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @AfterLoad()
  handleRoleMapping() {
    if (this.roles?.length > 0) {
      this.roleKeys  = this.roles.map(r => r.roleKey);
      this.roleNames = this.roles.map(r => r.roleName).join(', ');
      this.roleKey   = this.roles[0].roleKey;
      this.roleName  = this.roles[0].roleName;
    } else {
      this.roleKeys  = [];
      this.roleNames = '暂无角色';
      this.roleKey   = 'user';
      this.roleName  = '职员';
    }
  }
}