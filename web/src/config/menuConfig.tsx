/**
 * @file web/src/config/menuConfig.tsx
 * @version 2.1.0 [2026-04-28]
 * @desc 菜单配置 - 新增「角色管理」菜单项
 */
import React from 'react';
import {
  DesktopOutlined,
  CopyOutlined,
  BookOutlined,
  VerifiedOutlined,
  SettingOutlined,
  AuditOutlined,
  MailOutlined,
  UserOutlined,
  UserSwitchOutlined,
  TeamOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,  // ← 角色管理图标
  ApartmentOutlined,
} from '@ant-design/icons';

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[];
  children?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DesktopOutlined />,
    label: '业务看板',
    roles: [],
  },
  {
    key: 'crm_group',
    icon: <UserSwitchOutlined />,
    label: '客户管理',
    roles: ['admin', 'manager', 'sales'],
    children: [
      { key: '/crm', icon: <TeamOutlined />, label: '客户列表' },
    ],
  },
  {
    key: 'contract_group',
    icon: <CopyOutlined />,
    label: '合同管理',
    roles: ['admin', 'manager', 'sales', 'consultant', 'reviewer'],
    children: [
      { key: '/contract', icon: <FileSearchOutlined />, label: '合同列表' },
    ],
  },
  {
    key: '/certificates',
    icon: <BookOutlined />,
    label: '证书管理',
    roles: ['admin', 'manager', 'reviewer'],
  },
  {
    key: '/institutions',
    icon: <VerifiedOutlined />,
    label: '机构管理',
    roles: ['admin', 'manager'],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统设置',
    roles: ['admin'],
    children: [
      {
        key: '/system/certification',
        icon: <AuditOutlined />,
        roles: ['admin'],
        label: '认证类型',
      },
      {
        key: '/system/notification',
        icon: <MailOutlined />,
        roles: ['admin'],
        label: '通知管理',
      },
      {
        key: '/system/users',
        icon: <UserOutlined />,
        roles: ['admin'],
        label: '用户管理',
      },
      {
        key: '/system/roles',                          // ← 新增
        icon: <SafetyCertificateOutlined />,
        roles: ['admin'],
        label: '角色管理',
      },
      {
  key: '/system/depts',
  icon: <ApartmentOutlined />, 
  roles: ['admin'],
  label: '公司管理',
},
    ],
  },
];