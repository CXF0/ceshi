/**
 * @file web/src/components/Sidebar.tsx
 * @version 2.1.0 [2026-04-28]
 * @desc 修复菜单过滤逻辑：有任意子权限（按钮）就显示该菜单入口
 */
import React, { useMemo } from 'react';
import { Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import { menuConfig, MenuItem } from '../config/menuConfig';
import { usePermission } from '../hooks/usePermission';

interface SidebarProps {
  collapsed: boolean;
  activeKey: string;
}

/**
 * 判断一个菜单项是否应该显示
 * 规则：
 *  1. admin 全放行
 *  2. 菜单 key 本身在 permissions 里 → 显示
 *  3. 菜单 key 不在 permissions 里，但 permissions 里有以该 key 开头的按钮权限 → 显示
 *     例：permissions 有 "/crm:edit"，则 "/crm" 菜单也应显示
 *  4. 父级分组（key 不以 / 开头，如 crm_group）→ 由子项决定
 */
function menuVisible(itemKey: string, permissions: string[], isAdmin: boolean): boolean {
  if (isAdmin) return true;

  // 父级分组 key（非路由），不直接判断，由子项递归决定
  if (!itemKey.startsWith('/')) return true;

  // 菜单本身在权限列表里
  if (permissions.includes(itemKey)) return true;

  // 权限列表里有该菜单下的按钮权限（格式：/路由:操作）
  const prefix = itemKey + ':';
  return permissions.some(p => p.startsWith(prefix));
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeKey }) => {
  const navigate = useNavigate();
  const { isAdmin, permissions } = usePermission();

  const authorizedItems = useMemo(() => {
    const userInfo = (() => {
      try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; }
    })();
    const roleKey = userInfo.roleKey;

    const filterFn = (items: MenuItem[]): any[] => {
      return items
        .filter(item => {
          // 1. admin 全放行
          if (isAdmin) return true;

          // 2. roles 字段限制（粗粒度，先过这关）
          if (item.roles && item.roles.length > 0) {
            if (!item.roles.includes(roleKey)) return false;
          }

          // 3. permissions 精细控制（只对路由型 key 生效）
          //    如果 permissions 为空（未配置），降级为只按 roles 判断
          if (permissions.length > 0) {
            return menuVisible(item.key, permissions, isAdmin);
          }

          return true;
        })
        .map(item => ({
          ...item,
          children: item.children ? filterFn(item.children) : undefined,
        }))
        // 过滤掉没有可见子项的父级分组
        .filter(item => !item.children || item.children.length > 0);
    };

    return filterFn(menuConfig);
  }, [isAdmin, permissions]);

  return (
    <div className="sider-menu-container" style={{ paddingTop: 4 }}>
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        onClick={({ key }) => navigate(key)}
        className="modern-menu"
        items={authorizedItems}
      />
    </div>
  );
};

export default Sidebar;