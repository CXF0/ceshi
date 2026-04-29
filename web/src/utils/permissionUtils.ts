/**
 * 将此函数加入 RoleList.tsx，替换 handleSavePerm 里的 checkedKeys 直接使用
 *
 * 作用：勾选了 "/crm:add" 时，自动把 "/crm"、"crm_group" 也加入权限列表
 * 这样后端存的 permissions 里就包含了菜单入口，Sidebar 不会把菜单过滤掉
 */

import type { DataNode } from 'antd/es/tree';

/**
 * 根据已勾选的 key 列表，自动补充所有祖先节点的 key
 * @param checkedKeys 用户勾选的 key 数组
 * @param tree        完整权限树
 * @returns           补充了父级 key 的完整权限数组
 */
export function expandWithAncestors(checkedKeys: string[], tree: DataNode[]): string[] {
  // 建立 子key → 父key 的映射表
  const parentMap = new Map<string, string>();

  const buildMap = (nodes: DataNode[], parentKey?: string) => {
    nodes.forEach(node => {
      const key = node.key as string;
      if (parentKey) parentMap.set(key, parentKey);
      if (node.children) buildMap(node.children, key);
    });
  };
  buildMap(tree);

  const result = new Set<string>(checkedKeys);

  // 对每个已勾选的 key，逐级向上补充父级
  checkedKeys.forEach(key => {
    let cur = key;
    while (parentMap.has(cur)) {
      const parent = parentMap.get(cur)!;
      result.add(parent);
      cur = parent;
    }
  });

  return Array.from(result);
}

/**
 * ─────────────────────────────────────────────────────────────────
 * RoleList.tsx 中 handleSavePerm 的修改方式：
 *
 * 修改前：
 *   await request.put(`/role/${permTarget.id}`, {
 *     ...permTarget,
 *     permissions: checkedKeys,           // ← 只有用户勾选的
 *   });
 *
 * 修改后：
 *   import { expandWithAncestors } from '@/utils/permissionUtils';
 *   ...
 *   await request.put(`/role/${permTarget.id}`, {
 *     ...permTarget,
 *     permissions: expandWithAncestors(checkedKeys, PERMISSION_TREE),  // ← 自动补父级
 *   });
 * ─────────────────────────────────────────────────────────────────
 */