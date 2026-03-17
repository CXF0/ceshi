import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'zhengda_secret_2026', // 💡 这里的 Secret 必须和 Module 里的一致
    });
  }

  // 这里的 payload 就是你登录时加密进去的用户信息
  async validate(payload: any) {
    // 💡 这里返回的对象会被注入到 req.user 中
    return { 
      userId: payload.sub, 
      username: payload.username, 
      deptId: payload.deptId, 
      roleKey: payload.roleKey 
    };
  }
}