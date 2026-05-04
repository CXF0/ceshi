/**
 * @file server/src/users/users.service.ts
 * @version 2.1.0 [2026-05-04]
 * @desc 修复 getOrgTree：从数据库 depts 表读取公司，构建 上级→子公司→用户 三级树
 */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { Dept } from '../dept/dept.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Dept)
    private deptRepository: Repository<Dept>,
  ) {}

  // ─────────────────────────────────────────────────────────
  // 获取组织架构树（供定向发布 TreeSelect 使用）
  // 结构：根公司 → [子公司 →] 用户；末尾追加「按角色群发」节点
  // ─────────────────────────────────────────────────────────
  async getOrgTree(): Promise<any[]> {
    const [allDepts, users, roles] = await Promise.all([
      this.deptRepository.find({ where: { status: 1 }, order: { createdAt: 'ASC' } }),
      this.usersRepository.find({
        select: ['id', 'nickname', 'username', 'deptId'],
        where: { status: 1 },
      }),
      this.roleRepository.find({ select: ['id', 'roleName', 'roleKey'] }),
    ]);

    // deptId → 用户节点列表
    const usersByDept: Record<string, any[]> = {};
    for (const u of users) {
      const key = String(u.deptId);
      if (!usersByDept[key]) usersByDept[key] = [];
      usersByDept[key].push({
        title:  `👤 ${u.nickname || u.username}`,
        value:  `user-${u.id}`,
        key:    `user-${u.id}`,
        isLeaf: true,
      });
    }

    // deptId → 树节点（含用户子节点）
    const deptNodeMap: Record<string, any> = {};
    for (const d of allDepts) {
      deptNodeMap[d.id] = {
        title:     `🏢 ${d.deptName}`,
        value:     `dept-${d.id}`,
        key:       `dept-${d.id}`,
        _parentId: d.parentId,
        children:  [...(usersByDept[d.id] || [])],
      };
    }

    // 将子公司节点插到父公司 children 前部
    const roots: any[] = [];
    for (const d of allDepts) {
      const node = deptNodeMap[d.id];
      if (d.parentId && deptNodeMap[d.parentId]) {
        deptNodeMap[d.parentId].children.unshift(node);
      } else {
        roots.push(node);
      }
    }

    // 清理内部辅助字段，空 children 置 undefined
    const clean = (nodes: any[]): any[] =>
      nodes.map(({ _parentId: _, children, ...rest }) => ({
        ...rest,
        ...(children?.length ? { children: clean(children) } : {}),
      }));

    const deptTree = clean(roots);

    // 角色群发节点
    const roleNodes = {
      title:    '按角色群发',
      value:    'role-group',
      key:      'role-group',
      children: roles.map((r: any) => ({
        title:  `🎖️ ${r.roleName}`,
        value:  `role-${r.roleKey}`,
        key:    `role-${r.roleKey}`,
        isLeaf: true,
      })),
    };

    return [...deptTree, roleNodes];
  }

  // ─────────────────────────────────────────────────────────
  // 其余方法保持不变
  // ─────────────────────────────────────────────────────────

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'nickname', 'deptId', 'status'],
      relations: ['roles'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'id', 'username', 'nickname', 'deptId', 'status', 'phone', 'createdAt',
        'hasSalesTarget', 'salesTarget',
      ],
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

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

    const savedUser = (await this.usersRepository.save(userInstance)) as unknown as User;
    const { password: _, ...result } = savedUser as any;
    return result as User;
  }

  async update(id: number, updateUserDto: any): Promise<User> {
    const { roleIds, password, ...updateData } = updateUserDto;

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
      select: [
        'id', 'username', 'password', 'nickname', 'deptId', 'status', 'phone',
        'hasSalesTarget', 'salesTarget',
      ],
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

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
  }
}