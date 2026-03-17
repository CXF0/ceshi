import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../role/role.entity'; // 确保路径指向你新建的 role 文件夹

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

  @Column({ name: 'dept_id', type: 'int', default: 1, comment: '分公司ID' })
  deptId: number;

  // 📝 建议保留 roleKey 字段用于兼容旧逻辑，或者在迁移完成后彻底移除
  // @Column({ name: 'role_key', length: 50, default: 'user', comment: '旧版角色标识(兼容用)' })
  roleKey: string;

  // 🚀 改造核心：多对多关联
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'sys_user_roles', // 数据库中间表名
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[]; // 类型从 any 改为 Role[]

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}