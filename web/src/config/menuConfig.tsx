import React from 'react';
import { 
  DesktopOutlined, 
  FileProtectOutlined, 
  ShoppingOutlined, 
  SettingOutlined,
  PartitionOutlined
} from '@ant-design/icons';

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[]; // 允许访问的角色列表，为空则全员可见
  children?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  { 
    key: '/dashboard', 
    icon: <DesktopOutlined />, 
    label: '业务看板', 
    roles: [] 
  },
  { 
    key: 'crm', 
    icon: <FileProtectOutlined />, 
    label: '客户管理', 
    roles: ['admin', 'manager'],
    children: [
      { key: '/crm', label: '客户列表' },
    ]
  },
  { 
    key: 'contract', 
    icon: <ShoppingOutlined />, 
    label: '合同管理', 
    roles: ['admin', 'auditor'],
    children: [
      { key: '/contract', label: '合同列表' },
      { key: '/contract/:id', label: '合同模板' },
    ]
  },
  { 
    key: '/institution', 
    icon: <PartitionOutlined />, 
    label: '机构管理', 
    roles: ['admin', 'auditor'] 
  },
  { 
    key: 'system', // 父级用普通字符串，不要带 /
    icon: <SettingOutlined />, 
    label: '系统设置', 
    roles: ['admin'],
    children: [
      { 
        key: '/system/certification', // 👈 子级必须带 /，且必须与 App.tsx 路由完全一致
        icon: <PartitionOutlined />, 
        label: '认证类型' 
      },
    ]
  },
];