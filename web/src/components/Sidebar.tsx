/**
 * @file src/components/Sidebar.tsx
 * @desc 侧边栏菜单（仅菜单部分，Logo 由 AppLayout 统一渲染）
 */
import React, { useMemo } from 'react';
import { Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import { menuConfig, MenuItem } from '../config/menuConfig';

interface SidebarProps {
  collapsed: boolean;
  activeKey: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeKey }) => {
  const navigate = useNavigate();

  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch {
      return {};
    }
  }, []);

  // 按角色过滤菜单
  const authorizedItems = useMemo(() => {
    const userRoleKey = userInfo.roleKey;

    const filterFn = (items: MenuItem[]): any[] => {
      return items
        .filter(item => {
          if (!item.roles || item.roles.length === 0) return true;
          return item.roles.includes(userRoleKey);
        })
        .map(item => ({
          ...item,
          children: item.children ? filterFn(item.children) : undefined,
        }))
        .filter(item => !item.children || item.children.length > 0);
    };

    return filterFn(menuConfig);
  }, [userInfo.roleKey]);

  return (
    // ⚠️ 不再包含 Logo 区域，由 AppLayout 统一处理
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