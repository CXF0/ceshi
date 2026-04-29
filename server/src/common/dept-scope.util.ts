/**
 * @file server/src/common/dept-scope.util.ts
 * @version 2.1.0 [2026-04-28]
 * @desc 数据隔离工具（string 版本，dept id 为数字字符串 '1','2'...）
 *
 * 可见范围规则：
 *  - admin / manager：全部公司
 *  - 其他角色：自己公司 + 所有直接/间接下属公司（不含同级）
 */
import { Repository } from 'typeorm';
import { Dept } from '../dept/dept.entity';

function collectChildren(allDepts: Dept[], rootId: string, result: Set<string>) {
  result.add(rootId);
  for (const dept of allDepts) {
    if (dept.parentId === rootId && !result.has(dept.id)) {
      collectChildren(allDepts, dept.id, result);
    }
  }
}

export async function getDeptScope(
  deptRepo: Repository<Dept>,
  userDeptId: string | number,
  roleKey: string,
): Promise<string[]> {
  const deptId = String(userDeptId);

  if (roleKey === 'admin' || roleKey === 'manager') {
    const all = await deptRepo.find({ where: { status: 1 } });
    return all.map(d => d.id);
  }

  const allDepts = await deptRepo.find({ where: { status: 1 } });
  const result   = new Set<string>();
  collectChildren(allDepts, deptId, result);
  return Array.from(result);
}