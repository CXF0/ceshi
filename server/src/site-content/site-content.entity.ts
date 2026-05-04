import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_site_content')
export class SiteContent {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ type: 'json', comment: '官网内容配置' })
  content: any;

  @Column({ name: 'updated_by', type: 'int', nullable: true, comment: '最后更新人ID' })
  updatedBy: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
