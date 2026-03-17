/**
 * 获取所有角色列表（用于下拉框选择）
 */
export async function getRoleList() {
  const response = await fetch('/api/role/list', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.json();
}

/**
 * 更新用户信息（包含角色关联）
 * @param id 用户ID
 * @param data 包含 roleIds: number[] 的对象
 */
export async function updateUser(id: number, data: any) {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH', // 或者 PUT，根据你的 Controller 定义
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
}