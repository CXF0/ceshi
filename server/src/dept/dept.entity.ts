/**
 * @file server/src/dept/dept.entity.ts
 * @version 2.1.0 [2026-04-28]
 * @desc sys_depts.id 实际是 char(36) 存数字字符串（'1','2'...），保持 string 类型
 */
import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('sys_depts')
export class Dept {
  @PrimaryColumn({ type: 'char', length: 36, comment: '主键（数字字符串，如"1"）' })
  id: string;

  @Column({ name: 'dept_name', length: 100, comment: '分公司/部门名称' })
  deptName: string;

  @Column({ name: 'parent_id', type: 'char', length: 36, nullable: true, comment: '上级机构ID' })
  parentId: string | null;

  @Column({ nullable: true, comment: '负责人' })
  leader: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态: 1-正常, 0-停用' })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '创建时间' })
  createdAt: Date;
}