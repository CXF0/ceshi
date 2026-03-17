import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 这里可以自定义处理身份验证逻辑
  canActivate(context: ExecutionContext) {
    // 继承父类 AuthGuard 的逻辑
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // 如果有错误或者用户不存在（Token 校验失败）
    if (err || !user) {
      throw err || new UnauthorizedException('登录已过期或凭证无效，请重新登录');
    }
    // 💡 这里的 user 就是你之前在 JwtStrategy 中解析出来的 payload
    return user;
  }
}