import React, { useMemo } from 'react';
import { Menu, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { menuConfig, MenuItem } from '../config/menuConfig';

const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  activeKey: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeKey }) => {
  const navigate = useNavigate();

  // 获取登录时存入的权限信息
  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch {
      return {};
    }
  }, []);

  const userRoles = userInfo.roles || [];

  // 核心过滤逻辑
  const authorizedItems = useMemo(() => {
    // 1. 获取当前用户的单个角色标识
    const userRoleKey = userInfo.roleKey; 

    const filterFn = (items: MenuItem[]): any[] => {
      return items
        .filter(item => {
          // 如果菜单没设 roles 限制，直接放行
          if (!item.roles || item.roles.length === 0) return true;
          
          // ✅ 修正：直接判断用户的 roleKey 是否在菜单要求的数组中
          return item.roles.includes(userRoleKey);
        })
        .map(item => ({
          ...item,
          children: item.children ? filterFn(item.children) : undefined
        }))
        // 过滤掉没有子项的父级菜单
        .filter(item => !item.children || item.children.length > 0);
    };

    return filterFn(menuConfig);
  }, [userInfo.roleKey]); // 监听 roleKey 的变化

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="modern-logo-section">
        <div className="modern-logo-mark" />
        {!collapsed && (
          <div className="modern-logo-text">
            <Text strong style={{ fontSize: 16 }}>寻梦1</Text>
          </div>
        )}
      </div>
      
      <div className="sider-menu-container">
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={({ key }) => navigate(key)}
          className="modern-menu"
          items={authorizedItems}
        />
      </div>
    </div>
  );
};

export default Sidebar;