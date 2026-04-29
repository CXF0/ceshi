/**
 * @file web/src/components/PermButton.tsx
 * @desc 按钮级权限控制组件
 *
 * 用法：
 *   // 无权限时隐藏按钮
 *   <PermButton perm="/crm:add" type="primary" onClick={handleAdd}>新增</PermButton>
 *
 *   // 无权限时禁用按钮（而非隐藏）
 *   <PermButton perm="/crm:edit" disabled-mode="disabled">编辑</PermButton>
 *
 *   // 包装任意元素（非 Button）
 *   <PermButton perm="/contract:delete" asChild>
 *     <Popconfirm ...><Button danger>删除</Button></Popconfirm>
 *   </PermButton>
 */
import React from 'react';
import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';
import { usePermission } from '@/hooks/usePermission';

interface PermButtonProps extends ButtonProps {
  /** 所需权限 key，如 '/crm:add'，不传则始终显示 */
  perm?: string | string[];
  /** 无权限时的行为：hide=隐藏（默认），disabled=禁用并 tooltip 提示 */
  noPermMode?: 'hide' | 'disabled';
  /** 为 true 时直接渲染 children，不包装 Button（用于包装非 Button 元素） */
  asChild?: boolean;
  children?: React.ReactNode;
}

const PermButton: React.FC<PermButtonProps> = ({
  perm,
  noPermMode = 'hide',
  asChild = false,
  children,
  ...buttonProps
}) => {
  const { has } = usePermission();

  // 没有配置权限要求，直接渲染
  if (!perm) {
    return asChild
      ? <>{children}</>
      : <Button {...buttonProps}>{children}</Button>;
  }

  const hasPerm = has(perm);

  if (!hasPerm) {
    if (noPermMode === 'hide') return null;
    // disabled 模式：显示禁用按钮，hover 时 tooltip 提示
    return (
      <Tooltip title="您没有此操作权限">
        {asChild
          ? <span style={{ cursor: 'not-allowed', opacity: 0.4 }}>{children}</span>
          : <Button {...buttonProps} disabled>{children}</Button>
        }
      </Tooltip>
    );
  }

  return asChild
    ? <>{children}</>
    : <Button {...buttonProps}>{children}</Button>;
};

export default PermButton;