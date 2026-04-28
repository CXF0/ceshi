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

  /** ✨ 获取组织架构树 */
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

  /** 根据 ID 查找用户（内部使用） */
  async findById(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  /** 根据用户名查找用户 */
  async findOne(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'nickname', 'deptId', 'status'],
      relations: ['roles'],
    });
  }

  /** 获取所有用户列表 */
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      select: ['id', 'username', 'nickname', 'deptId', 'status', 'phone', 'createdAt'],
      relations: ['roles'],
      order: { createdAt: 'DESC' }
    });
  }

  /** 注册/新增用户 */
  async register(userData: any): Promise<User> {
    const { username, password, roleIds, ...rest } = userData;

    const existingUser = await this.usersRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('该账号已存在，请换一个试试');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userInstance = this.usersRepository.create({
      ...rest,
      username,
      password: hashedPassword,
      nickname: rest.nickname || username,
    });

    if (roleIds?.length > 0) {
      (userInstance as unknown as User).roles = await this.roleRepository.findBy({ id: In(roleIds) });
    }

    // 💡 沿用你验证过不报错的断言方式
    const savedUser = (await this.usersRepository.save(userInstance)) as unknown as User;
    
    const { password: _, ...result } = savedUser as any; 
    return result as User;
  }

  /** 更新用户 */
  async update(id: number, updateUserDto: any): Promise<User> {
    const { roleIds, password, ...updateData } = updateUserDto;

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
      select: ['id', 'username', 'password', 'nickname', 'deptId', 'status', 'phone']
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
      (user as unknown as User).roles = await this.roleRepository.findBy({ id: In(roleIds) });
    }

    const savedUser = (await this.usersRepository.save(user)) as unknown as User;

    const { password: _, ...result } = savedUser as any;
    return result as User;
  }

  /** 删除用户 */
  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
  }
}