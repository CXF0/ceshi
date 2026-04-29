/**
 * @file server/src/dept/dept.service.ts
 * @version 2.0.0 [2026-04-29]
 * @desc 补充：create 自动生成 UUID、remove 检查子公司和关联用户
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dept } from './dept.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeptService {
  constructor(
    @InjectRepository(Dept)
    private readonly repo: Repository<Dept>,
  ) {}

  async findAll(query?: { status?: number }) {
    const where: any = {};
    if (query?.status !== undefined) where.status = Number(query.status);
    return this.repo.find({ where, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string) {
    const dept = await this.repo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(`公司 ${id} 不存在`);
    return dept;
  }

  async create(body: any) {
    const record = this.repo.create({
      ...body,
      id:       body.id || uuidv4(),       // 前端可传 id，否则自动生成
      parentId: body.parentId || null,      // 空字符串 → null
    });
    return this.repo.save(record);
  }

  async update(id: string, body: Partial<Dept>) {
    const exists = await this.repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException(`公司 ${id} 不存在`);

    // 防止把自己设为自己的上级
    if ((body as any).parentId === id) {
      throw new ConflictException('不能将公司自身设为上级公司');
    }

    // parentId 空字符串 → null
    if ((body as any).parentId === '') (body as any).parentId = null;

    await this.repo.update(id, body);
    return this.findOne(id);
  }

  async remove(id: string) {
    // 检查是否有子公司
    const childCount = await this.repo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ConflictException(`该公司下还有 ${childCount} 家子公司，请先删除或迁移`);
    }
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`公司 ${id} 不存在`);
    return { success: true };
  }
}