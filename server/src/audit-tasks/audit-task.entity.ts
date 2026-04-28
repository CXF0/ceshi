import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * 对应数据库表：audit_tasks
 * 审核作业管理（初审、监审、再认证等现场审核任务）
 *
 * 注意：
 * - id 是 char(36) UUID 字符串，需要业务层手动生成（用 uuid 库）
 * - audit_team_members 存储逗号分隔的人员 ID 字符串
 */
@Entity('audit_tasks')
export class AuditTask {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'dept_id', type: 'char', length: 36, comment: '所属分公司ID' })
  deptId: string;

  @Column({ name: 'contract_id', type: 'char', length: 36, comment: '关联合同ID' })
  contractId: string;

  @Column({
    name: 'audit_type',
    length: 20,
    nullable: true,
    comment: '审核类型: 初审, 监审, 再认证',
  })
  auditType: string;

  @Column({ name: 'start_date', type: 'date', nullable: true, comment: '审核开始日期' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true, comment: '审核结束日期' })
  endDate: string;

  @Column({
    name: 'audit_team_leader',
    type: 'char',
    length: 36,
    nullable: true,
    comment: '审核组长ID',
  })
  auditTeamLeader: string;

  @Column({
    name: 'audit_team_members',
    type: 'text',
    nullable: true,
    comment: '组员ID列表（逗号分隔）',
  })
  auditTeamMembers: string;

  @Column({ name: 'audit_scope', type: 'text', nullable: true, comment: '审核范围描述' })
  auditScope: string;

  @Column({
    name: 'decision_result',
    length: 50,
    nullable: true,
    comment: '审核结论',
  })
  decisionResult: string;

  @Column({
    length: 20,
    default: 'pending',
    comment: '状态: pending-待开始, audit-in-progress-进行中, completed-已完成, cancelled-已取消',
  })
  status: string;
}