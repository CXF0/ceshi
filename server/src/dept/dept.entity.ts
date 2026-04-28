import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * 对应数据库表：sys_depts
 * 注意：主键 id 是 char(36) 字符串，而非自增整数
 */
@Entity('sys_depts')
export class Dept {
  @PrimaryColumn({ type: 'char', length: 36, comment: 'UUID主键' })
  id: string;

  @Column({ name: 'dept_name', length: 100, comment: '分公司/部门名称' })
  deptName: string;

  @Column({ name: 'parent_id', type: 'char', length: 36, nullable: true, comment: '上级机构ID' })
  parentId: string;

  @Column({ nullable: true, comment: '负责人' })
  leader: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态: 1-正常, 0-停用' })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '创建时间' })
  createdAt: Date;
}