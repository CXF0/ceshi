import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Institution } from './entities/institution.entity';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private readonly repo: Repository<Institution>,
  ) {}

  /**
   * 获取机构列表
   */
  async findAll(query: any) {
    const { name, is_active, institution_code } = query;
    const where: any = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (institution_code) {
      where.institution_code = Like(`%${institution_code}%`);
    }

    if (is_active !== undefined && is_active !== '') {
      where.is_active = Number(is_active);
    }

    return await this.repo.find({
      where,
      order: { id: 'DESC' }, // 通常自增 ID 降序就是最新创建
    });
  }

  /**
   * 获取单个机构详情 (使用数字 ID)
   */
  async findOne(id: number) {
    const data = await this.repo.findOne({ where: { id } });
    if (!data) throw new NotFoundException(`机构 ID ${id} 不存在`);
    return data;
  }

  /**
   * 创建机构
   * 此时 body 应包含 institution_code 而非 id
   */
  async create(body: any) {
    try {
      // 检查业务代码是否已存在
      const exists = await this.repo.findOne({ where: { institution_code: body.institution_code } });
      if (exists) {
        throw new ConflictException(`机构代码 ${body.institution_code} 已存在`);
      }

      const record = this.repo.create(body);
      return await this.repo.save(record);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('创建机构失败');
    }
  }

  /**
   * 更新机构信息
   */
  async update(id: number, body: any) {
    // 排除掉不准修改的字段，比如自增 id 本身
    const { id: _, ...updateData } = body;
    
    const result = await this.repo.update(id, updateData);
    if (result.affected === 0) throw new NotFoundException('机构不存在');
    
    return this.findOne(id);
  }

  /**
   * 删除机构
   */
  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('机构不存在');
    return { success: true };
  }
}