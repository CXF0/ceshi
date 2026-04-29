/**
 * @file web/src/hooks/useDeptOptions.ts
 * @version 2.1.0 [2026-04-28]
 * @desc 获取当前用户可见的公司选项（dept id 为数字字符串 '1','2'...）
 */
import { useEffect, useState } from 'react';
import request from '@/utils/request';

export interface DeptItem {
  id: string;
  deptName: string;
  parentId: string | null;
}

function collectSubDepts(all: DeptItem[], rootId: string): string[] {
  const result = new Set<string>();
  const walk = (id: string) => {
    result.add(id);
    all.filter(d => d.parentId === id).forEach(d => walk(d.id));
  };
  walk(rootId);
  return Array.from(result);
}

export function useDeptOptions() {
  const [deptOptions, setDeptOptions] = useState<{ label: string; value: string }[]>([]);
  const [deptMap, setDeptMap]         = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const roleKey  = userInfo.roleKey;
        const myDeptId = String(userInfo.deptId || '1');

        const res: any = await request.get('/depts');
        const list: DeptItem[] = res?.data?.data || res?.data || [];

        const nameMap: Record<string, string> = {};
        list.forEach(d => { nameMap[d.id] = d.deptName; });
        setDeptMap(nameMap);

        if (roleKey === 'admin' || roleKey === 'manager') {
          setDeptOptions(list.map(d => ({ label: d.deptName, value: d.id })));
        } else {
          const visibleIds = collectSubDepts(list, myDeptId);
          setDeptOptions(visibleIds.map(id => ({ label: nameMap[id] || `公司${id}`, value: id })));
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  return { deptOptions, deptMap, loading };
}