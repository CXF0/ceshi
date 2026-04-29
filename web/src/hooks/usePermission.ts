/**
 * @file web/src/hooks/usePermission.ts
 * @desc 权限判断 Hook
 *
 * 用法：
 *   const { has, permissions } = usePermission();
 *   has('/crm:add')          // 是否有某个按钮权限
 *   has('/crm')              // 是否有某个菜单权限
 *   has(['/crm:add', '/crm:edit'])  // 是否同时拥有多个权限（AND）
 *   hasAny(['/crm:add', '/crm:edit'])  // 是否拥有其中任一权限（OR）
 *
 * admin 角色默认拥有全部权限，无需配置。
 */
import { useMemo } from 'react';

interface UsePermissionReturn {
  permissions: string[];
  /** 是否拥有指定权限（传数组时为 AND，全部满足才返回 true） */
  has: (perm: string | string[]) => boolean;
  /** 是否拥有指定权限中的任意一个（OR） */
  hasAny: (perms: string[]) => boolean;
  /** 是否是超级管理员（admin） */
  isAdmin: boolean;
}

export function usePermission(): UsePermissionReturn {
  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAdmin = userInfo.roleKey === 'admin';

  // admin 默认全权限，其他角色取登录时存入的 permissions 数组
  const permissions: string[] = useMemo(() => {
    if (isAdmin) return ['*']; // 通配符，has() 里会处理
    try {
      const raw = userInfo.permissions;
      return Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  }, [isAdmin, userInfo.permissions]);

  const has = (perm: string | string[]): boolean => {
    if (isAdmin) return true;
    if (Array.isArray(perm)) {
      return perm.every(p => permissions.includes(p));
    }
    return permissions.includes(perm);
  };

  const hasAny = (perms: string[]): boolean => {
    if (isAdmin) return true;
    return perms.some(p => permissions.includes(p));
  };

  return { permissions, has, hasAny, isAdmin };
}