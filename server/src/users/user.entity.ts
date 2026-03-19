import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
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

  @Column({ name: 'dept_id', type: 'int', default: 1, comment: '分公司ID' })
  deptId: number;

  /**
   * 💡 关键修改 1：移除原本的 roleKey 声明，改为可序列化的虚字段
   * 虽然不对应数据库列，但声明后，Service 里的赋值才能被 JSON 序列化
   */
  roleKey: string;

  /**
   * 💡 关键修改 2：显式声明 roleName
   */
  roleName: string;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'sys_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}