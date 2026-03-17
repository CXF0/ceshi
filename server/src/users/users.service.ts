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
    // 💡 建议在 UsersModule 中也引入 Dept 实体，或者这里注入一个通用的连接来查询部门
    // 如果没有 DeptRepository，可以通过 usersRepository 聚合查询，但推荐注入专门的 Repository
  ) {}

  /**
   * ✨ 获取组织架构树 (用于定向发布选择器)
   * 返回结构：[ { title: '部门', value: 'dept-1', children: [ { title: '用户', value: 'user-1' } ] } ]
   */
  async getOrgTree(): Promise<any[]> {
    // 1. 获取所有用户
    const users = await this.usersRepository.find({
      select: ['id', 'nickname', 'deptId'],
      where: { status: 1 } // 仅查询启用状态的用户
    });

    // 2. 模拟部门数据（或者从数据库查询）
    // 对应你之前提供的部门列表
    const depts = [
      { id: 1, name: '寻梦控股昆明分公司' },
      { id: 2, name: '寻梦认证成都分公司' },
      { id: 3, name: '寻梦控股总公司' },
      { id: 4, name: '寻梦认证杭州分公司' },
      { id: 5, name: '寻梦控股宣城总公司' },
    ];

    // 3. 获取所有角色（可选：如果需要定向到角色）
    const roles = await this.roleRepository.find({ select: ['id', 'roleName', 'roleKey'] });

    // 4. 构建树形结构
    const treeData = depts.map(dept => {
      // 筛选属于该部门的用户
      const deptUsers = users
        .filter(user => user.deptId === dept.id)
        .map(user => ({
          title: `👤 ${user.nickname}`,
          value: `user-${user.id}`, // 加前缀区分类型
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

    // 5. 额外：在顶层加入按“角色”筛选的分类（如果需要）
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
   * 登录查询 - 已适配去冗余化
   */
  async findOne(username: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'nickname', 'deptId', 'status'],
      relations: ['roles'],
    });

    if (user && user.roles && user.roles.length > 0) {
      (user as any).roleKey = user.roles[0].roleKey;
    } else if (user) {
      (user as any).roleKey = 'user'; 
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

    return users.map(user => {
      if (user.roles && user.roles.length > 0) {
        (user as any).roleKey = user.roles[0].roleKey;
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
      if (roles && roles.length > 0) {
        (newUser as any).roleKey = roles[0].roleKey;
      }
    }

    const savedUser: any = await this.usersRepository.save(newUser);
    
    const { password: _, ...userWithoutPassword } = savedUser;
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
        (user as any).roleKey = roles[0].roleKey;
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