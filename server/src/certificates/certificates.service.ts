import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly repo: Repository<Certificate>,
  ) {}

  async findAll(query: { customer_id?: string }) {
    const qb = this.repo.createQueryBuilder('cert');
    
    // 💡 关联认证类型实体（前提是你在 Entity 建立了 Relation）
    qb.leftJoinAndSelect('cert.category', 'category');

    if (query.customer_id) {
      qb.andWhere('cert.customer_id = :customer_id', { customer_id: query.customer_id });
    }

    qb.orderBy('cert.created_at', 'DESC');
    return await qb.getMany();
  }

  async create(body: any) {
    const newRecord = this.repo.create(body);
    return await this.repo.save(newRecord);
  }

  async update(id: string, body: any) {
    const exists = await this.repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('证书不存在');
    await this.repo.update(id, body);
    return { success: true };
  }

  async remove(id: string) {
    return await this.repo.delete(id);
  }
}