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
    // 💡 重点 1：这一行会直接打印出当前环境下 123456 的正确密文
    const currentHash = await bcrypt.hash('123456', 10);
    
    console.log('==================================================');
    console.log('【第一步：请复制下方这串密文去更新数据库 admin 的 password 字段】');
    console.log(currentHash);
    console.log('==================================================');

    const user = await this.usersService.findOne(username);
    
    if (!user) {
      this.logger.error(`登录失败：用户 [${username}] 不存在`);
      throw new UnauthorizedException('账号或密码错误');
    }

    // 深度清洗
    const cleanDbPassword = String(user.password || '').trim();
    const cleanInputPassword = String(pass || '').trim();


    const isMatch = await bcrypt.compare(cleanInputPassword, cleanDbPassword);
    
    console.log('匹配结果:', isMatch);

    if (!isMatch) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const payload = { 
      username: user.username, 
      sub: user.id, 
      deptId: user.deptId, 
      roleKey: user.roleKey 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: { 
        id: user.id,
        username: user.username, 
        nickname: user.nickname,
        deptId: user.deptId, 
        roleKey: user.roleKey
      }
    };
  }
}