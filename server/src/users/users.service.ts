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
   * ✨ 获取组织架构树
   */
  async getOrgTree(): Promise<any[]> {
    const users = await this.usersRepository.find({
      select: ['id', 'nickname', 'deptId'],
      where: { status: 1 }
    });

    const depts = [
      { id: 1, name: '寻梦控股昆明分公司' },
      { id: 2, name: '寻梦认证成都分公司' },
      { id: 3, name: '寻梦控股总公司' },
      { id: 4, name: '寻梦认证杭州分公司' },
      { id: 5, name: '寻梦控股宣城总公司' },
    ];

    const roles = await this.roleRepository.find({ select: ['id', 'roleName', 'roleKey'] });

    const treeData = depts.map(dept => {
      const deptUsers = users
        .filter(user => user.deptId === dept.id)
        .map(user => ({
          title: `👤 ${user.nickname}`,
          value: `user-${user.id}`,
          key: `user-${user.id}`,
          isLeaf: true,
        }));

      return {
        title: dept.name,
        value: `dept-${dept.id}`,
        key: `dept-${dept.id}`,
        children: deptUsers,
      };
    });

    const roleNodes = {
      title: '按角色群发',
      value: 'role-group',
      key: 'role-group',
      children: roles.map(role => ({
        title: `🎖️ ${role.roleName}`,
        value: `role-${role.roleKey}`,
        key: `role-${role.roleKey}`,
        isLeaf: true,
      }))
    };

    return [...treeData, roleNodes];
  }

  /**
   * 💡 修正点：登录查询 - 补全 roleName 挂载
   */
  async findOne(username: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
      // 确保 nickname 被选中
      select: ['id', 'username', 'password', 'nickname', 'deptId', 'status'],
      relations: ['roles'],
    });

    if (user && user.roles && user.roles.length > 0) {
      // 💡 关键修正：同时挂载 roleKey 和 roleName
      (user as any).roleKey = user.roles[0].roleKey;
      (user as any).roleName = user.roles[0].roleName; 
    } else if (user) {
      (user as any).roleKey = 'user';
      (user as any).roleName = '职员';
    }

    return user;
  }

  /**
   * 获取所有用户列表 - 补全角色信息
   */
  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      select: ['id', 'username', 'nickname', 'deptId', 'status'],
      relations: ['roles'],
      order: { createdAt: 'DESC' }
    });

    return users.map(user => {
      if (user.roles && user.roles.length > 0) {
        (user as any).roleKey = user.roles[0].roleKey;
        (user as any).roleName = user.roles[0].roleName; // 💡 补全
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
    }

    const savedUser: any = await this.usersRepository.save(newUser);
    const { password: _, ...userWithoutPassword } = savedUser;

    if (savedUser.roles?.length > 0) {
      (userWithoutPassword as any).roleKey = savedUser.roles[0].roleKey;
      (userWithoutPassword as any).roleName = savedUser.roles[0].roleName; // 💡 补全
    }

    return userWithoutPassword as User;
  }

  /**
   * 更新用户
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
    }

    const savedResult: any = await this.usersRepository.save(user);
    const { password: _, ...userWithoutPassword } = savedResult;
    
    if (savedResult.roles?.length > 0) {
      (userWithoutPassword as any).roleKey = savedResult.roles[0].roleKey;
      (userWithoutPassword as any).roleName = savedResult.roles[0].roleName; // 💡 补全
    }

    return userWithoutPassword as User;
  }
}