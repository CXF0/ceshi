import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CertificationType } from './entities/cert-type.entity';

@Injectable()
export class CertTypesService {
  constructor(
    @InjectRepository(CertificationType)
    private readonly repo: Repository<CertificationType>,
  ) {}

  async findAll(query?: any) {
    const where: any = {};
    if (query?.is_active !== undefined && query?.is_active !== '') {
      where.is_active = Number(query.is_active);
    }
    if (query?.parent_name) {
      where.parent_name = Like(`%${query.parent_name}%`);
    }

    return await this.repo.find({
      where,
      order: { sort: 'ASC', id: 'DESC' },
    });
  }

  async create(body: any) {
    try {
      const newRecord = this.repo.create(body);
      return await this.repo.save(newRecord);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new ConflictException(`认证项代码 "${body.type_code}" 已存在`);
      }
      throw new InternalServerErrorException('创建失败');
    }
  }

  async update(id: number, body: any) {
    const exists = await this.repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException(`ID ${id} 不存在`);
    await this.repo.update(id, body);
    return { success: true };
  }

  async remove(id: number) {
    return await this.repo.softDelete(id);
  }
}