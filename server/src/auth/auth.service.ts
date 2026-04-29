/**
 * @file server/src/auth/auth.service.ts
 * @version 2.1.0 [2026-04-28]
 * @desc 修复：role.permissions 可能已是数组，不需要再 JSON.parse
 */
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, pass: string) {
    const user = await this.usersService.findOne(username);

    if (!user) {
      this.logger.error(`登录失败：用户 [${username}] 不存在`);
      throw new UnauthorizedException('账号或密码错误');
    }

    const isMatch = await bcrypt.compare(
      String(pass || '').trim(),
      String(user.password || '').trim(),
    );

    if (!isMatch) {
      throw new UnauthorizedException('账号或密码错误');
    }

    // ── 合并该用户所有角色的 permissions ──────────────────
    const permissionsSet = new Set<string>();

    if (user.roles?.length > 0) {
      for (const role of user.roles) {
        // role.permissions 可能是：
        //   1. 已被 service deserialize 成数组：string[]
        //   2. 还是原始 JSON 字符串：string
        //   3. null / undefined
        let perms: string[] = [];

        if (Array.isArray((role as any).permissions)) {
          // 情况 1：已经是数组，直接用
          perms = (role as any).permissions;
        } else if (typeof (role as any).permissionsRaw === 'string') {
          // 情况 2：从 raw 字段解析
          try {
            perms = JSON.parse((role as any).permissionsRaw);
          } catch { perms = []; }
        } else if (typeof (role as any).permissions === 'string') {
          // 情况 3：permissions 是字符串，尝试 parse
          try {
            perms = JSON.parse((role as any).permissions);
          } catch { perms = []; }
        }

        perms.forEach(p => permissionsSet.add(p));
      }
    }

    const permissions = Array.from(permissionsSet);

    const payload = {
      username: user.username,
      sub:      user.id,
      deptId:   user.deptId,
      roleKey:  user.roleKey,
      roleName: user.roleName,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id:          user.id,
        username:    user.username,
        nickname:    user.nickname,
        deptId:      user.deptId,
        roleKey:     user.roleKey,
        roleName:    user.roleName,
        roles:       user.roles,
        permissions, // ← 正确合并后的权限数组
      },
    };
  }
}