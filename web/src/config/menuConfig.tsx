import React from 'react';
import { 
  DesktopOutlined, 
  FileProtectOutlined, 
  ShoppingOutlined, 
  SettingOutlined,
  PartitionOutlined,
  TeamOutlined,
  BellOutlined,
  SafetyCertificateOutlined,
  BankOutlined
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
    key: 'crm_group', 
    icon: <TeamOutlined />, 
    label: '客户管理', 
    roles: ['admin', 'manager'],
    children: [
      { key: '/crm', label: '客户列表' },
    ]
  },
  { 
    key: 'contract_group', 
    icon: <ShoppingOutlined />, 
    label: '合同管理', 
    roles: ['admin', 'auditor'],
    children: [
      { key: '/contract', label: '合同列表' },
    ]
  },
  { 
    key: '/certificates', // 
    icon: <BankOutlined />, 
    label: '证书管理', 
    roles: ['admin', 'auditor'] 
  },
  { 
    key: '/institutions', // 💡 已统一为复数，确保与 App.tsx 路由一致
    icon: <BankOutlined />, 
    label: '机构管理', 
    roles: ['admin', 'auditor'] 
  },
  { 
    key: 'system', 
    icon: <SettingOutlined />, 
    label: '系统设置', 
    roles: ['admin'],
    children: [
      { 
        key: '/system/certification', 
        icon: <SafetyCertificateOutlined />, 
        label: '认证类型' 
      },
      { 
        key: '/system/notification', 
        icon: <BellOutlined />, 
        label: '通知管理' 
      },
    ]
  },
];