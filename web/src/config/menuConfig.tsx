/**
 * @file web/src/config/menuConfig.tsx
 * @version 3.0.0 [2026-05-04]
 * @desc 新增「客户咨询」菜单项
 */
import React from 'react';
import {
  DesktopOutlined, CopyOutlined, BookOutlined, VerifiedOutlined,
  SettingOutlined, AuditOutlined, MailOutlined, UserOutlined,
  UserSwitchOutlined, TeamOutlined, FileSearchOutlined,
  SafetyCertificateOutlined, ApartmentOutlined,
  MessageOutlined, GlobalOutlined,
} from '@ant-design/icons';

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[];
  children?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  { key: '/dashboard', icon: <DesktopOutlined />, label: '业务看板', roles: [] },
  {
    key: 'crm_group', icon: <UserSwitchOutlined />, label: '客户管理',
    roles: ['admin', 'manager', 'sales'],
    children: [
      { key: '/crm', icon: <TeamOutlined />, label: '客户列表' },
    ],
  },
  {
    key: 'contract_group', icon: <CopyOutlined />, label: '合同管理',
    roles: ['admin', 'manager', 'sales', 'consultant', 'reviewer'],
    children: [
      { key: '/contract', icon: <FileSearchOutlined />, label: '合同列表' },
    ],
  },
  { key: '/certificates',  icon: <BookOutlined />,     label: '证书管理', roles: ['admin', 'manager', 'reviewer'] },
  { key: '/institutions',  icon: <VerifiedOutlined />, label: '机构管理', roles: ['admin', 'manager'] },
  // ★ 新增：客户咨询
  { key: '/inquiries', icon: <MessageOutlined />, label: '客户咨询', roles: ['admin', 'manager', 'sales'] },
  {
    key: 'system', icon: <SettingOutlined />, label: '系统设置', roles: ['admin'],
    children: [
      { key: '/system/certification', icon: <AuditOutlined />,              roles: ['admin'], label: '认证类型' },
      { key: '/system/notification',  icon: <MailOutlined />,               roles: ['admin'], label: '通知管理' },
      { key: '/system/website',       icon: <GlobalOutlined />,             roles: ['admin'], label: '官网管理' },
      { key: '/system/users',         icon: <UserOutlined />,               roles: ['admin'], label: '用户管理' },
      { key: '/system/roles',         icon: <SafetyCertificateOutlined />,  roles: ['admin'], label: '角色管理' },
      { key: '/system/depts',         icon: <ApartmentOutlined />,          roles: ['admin'], label: '公司管理' },
    ],
  },
];