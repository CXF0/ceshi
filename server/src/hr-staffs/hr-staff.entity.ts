import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * 对应数据库表：hr_staffs
 * 人员与审核员信息表（可充当审核组长/组员的资源池）
 * cert_info / expertise_codes 存储审核员的资质证书和专业代码
 */
@Entity('hr_staffs')
export class HrStaff {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'dept_id', type: 'char', length: 36, comment: '所属分公司ID' })
  deptId: string;

  @Column({ length: 50, comment: '姓名' })
  name: string;

  @Column({ name: 'staff_type', length: 20, nullable: true, comment: '专职/兼职' })
  staffType: string;

  @Column({ name: 'id_card', length: 20, nullable: true, comment: '身份证号' })
  idCard: string;

  /**
   * cert_info 存储 JSON，格式示例：
   * [{ "name": "ISO9001主任审核员", "certNo": "ABC123", "validUntil": "2028-01-01" }]
   */
  @Column({ name: 'cert_info', type: 'json', nullable: true, comment: '持有的资质证书' })
  certInfo: any[];

  @Column({ name: 'expertise_codes', type: 'text', nullable: true, comment: '专业代码（逗号分隔）' })
  expertiseCodes: string;

  @Column({
    length: 20,
    default: 'normal',
    comment: '状态: normal-在职, resigned-离职, frozen-冻结',
  })
  status: string;
}