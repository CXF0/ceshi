import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 获取装饰器标注的角色信息
    // getAllAndOverride 会优先读取方法上的装饰器，如果没有，则读取类上的
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), // 获取具体方法（函数）上的元数据
      context.getClass(),   // ✅ 修正：获取 Controller 类上的元数据
    ]);

    // 如果没有标注 @Roles，则默认放行
    if (!requiredRoles) {
      return true;
    }

    // 2. 获取请求中的用户信息（确保已经过了 JwtAuthGuard）
    const { user } = context.switchToHttp().getRequest();

    // 校验用户信息及角色数组是否存在
    // 注意：我们在 UsersService 中已经保证了 user.roles 是一个数组
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('权限不足：无法获取用户信息或角色');
    }

    // 3. 匹配角色标识 (roleKey)
    const hasRole = user.roles.some((role: any) => 
      requiredRoles.includes(role.roleKey)
    );

    if (!hasRole) {
      throw new ForbiddenException('权限不足：您没有操作权限');
    }

    return true;
  }
}