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
  BankOutlined,
  CopyOutlined,
  BookOutlined,
  VerifiedOutlined,
  TagsOutlined,
  SoundOutlined,
  MailOutlined,
  AuditOutlined,
  FileSearchOutlined,
  UserSwitchOutlined,
  UserOutlined
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
    icon: <UserSwitchOutlined />, 
    label: '客户管理', 
    roles: ['admin', 'manager'],
    children: [
      { key: '/crm', icon: <TeamOutlined />, label: '客户列表' },
    ]
  },
  { 
    key: 'contract_group', 
    icon: <CopyOutlined />, 
    label: '合同管理', 
    roles: ['admin', 'auditor'],
    children: [
      { key: '/contract', icon: <FileSearchOutlined />,label: '合同列表' },
    ]
  },
  { 
    key: '/certificates', // 
    icon: <BookOutlined />, 
    label: '证书管理', 
    roles: ['admin', 'auditor'] 
  },
  { 
    key: '/institutions', // 💡 已统一为复数，确保与 App.tsx 路由一致
    icon: <VerifiedOutlined />, 
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
        icon: <AuditOutlined />, 
        roles: ['admin'],
        label: '认证类型' 
      },
      { 
        key: '/system/notification', 
        icon: <MailOutlined />, 
        roles: ['admin'],
        label: '通知管理' 
      },
      { 
        key: '/system/users', 
        icon: <UserOutlined />, 
        roles: ['admin'],
        label: '用户管理' 
      },
    ]
  },
];