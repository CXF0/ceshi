import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToMany, 
  JoinTable,
  AfterLoad
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

  @Column({ name: 'dept_id', type: 'int', default: 1, comment: '分公司ID' })
  deptId: number;

  /** 💡 虚字段：所有角色的 Key 数组，用于前端权限判断 */
  roleKeys: string[];

  /** 💡 虚字段：所有角色的名称字符串（逗号分隔），用于前端表格展示 */
  roleNames: string;

  /** 💡 兼容旧字段：取第一个角色的 Key */
  roleKey: string;

  /** 💡 兼容旧字段：取第一个角色的名称 */
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

  @AfterLoad()
  handleRoleMapping() {
    if (this.roles && this.roles.length > 0) {
      this.roleKeys = this.roles.map(role => role.roleKey);
      this.roleNames = this.roles.map(role => role.roleName).join(', ');
      
      // 兼容单体逻辑
      this.roleKey = this.roles[0].roleKey;
      this.roleName = this.roles[0].roleName;
    } else {
      this.roleKeys = [];
      this.roleNames = '暂无角色';
      this.roleKey = 'user';
      this.roleName = '职员';
    }
  }
}