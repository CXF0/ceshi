import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * 登录查询 - 已适配去冗余化
   */
  async findOne(username: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
      // 注意：这里已经没有 roleKey 了
      select: ['id', 'username', 'password', 'nickname', 'deptId', 'status'],
      relations: ['roles'],
    });

    // ✨ 核心修复：手动挂载动态角色标识
    if (user && user.roles && user.roles.length > 0) {
      user.roleKey = user.roles[0].roleKey;
    } else if (user) {
      user.roleKey = 'user'; // 保底角色
    }

    return user;
  }

  /**
   * 获取所有用户列表
   */
  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      select: ['id', 'username', 'nickname', 'deptId', 'status'],
      relations: ['roles'],
      order: { createdAt: 'DESC' }
    });

    // 同样为列表中的每个用户挂载动态角色标识
    return users.map(user => {
      if (user.roles && user.roles.length > 0) {
        user.roleKey = user.roles[0].roleKey;
      }
      return user;
    });
  }

  /**
   * 注册/新增用户
   */
  async register(userData: any): Promise<User> {
    const { username, password, roleIds } = userData;

    const existingUser = await this.usersRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('该账号已存在，请换一个试试');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = this.usersRepository.create({
      ...userData,
      username,
      password: hashedPassword,
      nickname: userData.nickname || username,
    }) as unknown as User; 

    if (roleIds && roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({ id: In(roleIds) });
      newUser.roles = roles;
      // 这里的赋值是给对象属性，即使数据库没这一列，JSON里也会有
      if (roles && roles.length > 0) {
        newUser.roleKey = roles[0].roleKey;
      }
    }

    const savedUser: any = await this.usersRepository.save(newUser);
    
    const { password: _, ...userWithoutPassword } = savedUser;
    // 确保返回时包含动态赋值的 roleKey
    if (savedUser.roles?.length > 0) {
      (userWithoutPassword as any).roleKey = savedUser.roles[0].roleKey;
    }

    return userWithoutPassword as User;
  }

  /**
   * 更新用户及其角色
   */
  async update(id: number, updateUserDto: any): Promise<User> {
    const { roleIds, password, ...updateData } = updateUserDto;

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`未找到ID为 ${id} 的用户`);
    }

    Object.assign(user, updateData);

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (roleIds && Array.isArray(roleIds)) {
      const roles = await this.roleRepository.findBy({ id: In(roleIds) });
      user.roles = roles;
      if (roles && roles.length > 0) {
        user.roleKey = roles[0].roleKey;
      }
    }

    const savedResult: any = await this.usersRepository.save(user);
    const { password: _, ...userWithoutPassword } = savedResult;
    
    if (savedResult.roles?.length > 0) {
      (userWithoutPassword as any).roleKey = savedResult.roles[0].roleKey;
    }

    return userWithoutPassword as User;
  }
}