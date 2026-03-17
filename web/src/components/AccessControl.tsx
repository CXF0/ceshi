import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

const AccessControl: React.FC<Props> = ({ children, requiredRoles, fallback }) => {
  // 从本地存储或状态管理(如 Zustand/Redux)获取用户信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRoles = userInfo.roles || [];

  // 如果没有设置要求，或者匹配成功，则放行
  if (!requiredRoles || requiredRoles.length === 0) return <>{children}</>;

  const hasAccess = userRoles.some((role: any) => requiredRoles.includes(role.roleKey));

  if (!hasAccess) {
    // 如果没有权限，默认跳转到 403 或显示提示
    return (fallback as any) || <div style={{ padding: 20 }}>403 - 您没有权限访问此页面</div>;
  }

  return <>{children}</>;
};

export default AccessControl;