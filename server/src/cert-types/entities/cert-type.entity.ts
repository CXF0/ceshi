import { 
  Entity, Column, PrimaryGeneratedColumn, 
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn 
} from 'typeorm';

@Entity('sys_certification_type')
export class CertificationType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '所属大类代码' })
  parent_code: string;

  @Column({ comment: '所属大类名称' })
  parent_name: string;

  @Column({ unique: true, comment: '认证项代码' })
  type_code: string;

  @Column({ comment: '认证项名称' })
  type_name: string;

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string;

  @Column({ name: 'remind_days', type: 'int', default: 30, comment: '年审预警提前天数' })
remind_days: number;

@Column({ name: 'material_days', type: 'int', default: 7, comment: '材料起草时限' })
material_days: number;

  @Column({ default: 0, comment: '排序' })
  sort: number;

  @Column({ default: 1, comment: '状态: 1启用, 0禁用' })
  is_active: number;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;

  // 💡 必须加上这一行！
  // 运行后，TypeORM 会在数据库生成 deleted_at 字段
  @DeleteDateColumn({ comment: '软删除时间' })
  deleted_at: Date;
}