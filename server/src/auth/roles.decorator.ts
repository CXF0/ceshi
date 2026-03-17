import { SetMetadata } from '@nestjs/common';

// 这里的 'roles' 字符串要与 Guard 中读取的 key 一致
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);