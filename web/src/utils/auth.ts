/**
 * 判断用户是否有权限
 * @param userRoles 用户拥有的角色对象数组 (来自登录接口)
 * @param requiredRoles 页面要求的角色标识数组
 */
export function hasPermission(userRoles: any[], requiredRoles: string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRoles) return false;
  
  // 匹配 roleKey
  return userRoles.some(role => requiredRoles.includes(role.roleKey));
}