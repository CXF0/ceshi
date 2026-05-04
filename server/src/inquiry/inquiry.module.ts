/**
 * @file server/src/inquiry/inquiry.module.ts
 * @version 2.0.0 [2026-05-04]
 * @desc 客户咨询 + 客户经理 + SSE 实时推送
 *
 * SSE 方案：
 *  - GET /api/inquiries/sse  — 前端长连接，登录用户建立后保持连接
 *  - POST /api/inquiries     — 官网提交后，通过 SseService 广播新咨询事件
 *  - 无需 WebSocket，Nginx/Node 直接支持，天然防 CORS
 */
import {
  Module, Injectable, Controller,
  Get, Post, Patch, Body, Param, Query, Res,
  Put, Delete, ParseIntPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import express from 'express';
import { SiteInquiry, ReplyRecord } from './entities/site-inquiry.entity';
import { SiteManager } from './entities/site-manager.entity';

// ══════════════════════════════════════════════
// SSE 连接管理 Service
// ══════════════════════════════════════════════
@Injectable()
export class SseService {
  /** 保存所有活跃的 SSE 响应对象 */
  private clients = new Map<string, express.Response>();

  /** 注册一个新的 SSE 客户端 */
  register(id: string, res: express.Response) {
    this.clients.set(id, res);
  }

  /** 移除断开的客户端 */
  remove(id: string) {
    this.clients.delete(id);
  }

  /** 向所有在线后台用户广播事件 */
  broadcast(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((res, id) => {
      try {
        res.write(payload);
      } catch {
        this.clients.delete(id);
      }
    });
  }

  /** 发送 heartbeat，防止连接超时 */
  heartbeat() {
    this.clients.forEach((res, id) => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        this.clients.delete(id);
      }
    });
  }
}

// ══════════════════════════════════════════════
// Inquiry Service
// ══════════════════════════════════════════════
@Injectable()
export class InquiryService {
  constructor(
    @InjectRepository(SiteInquiry) private repo: Repository<SiteInquiry>,
    @InjectRepository(SiteManager) private managerRepo: Repository<SiteManager>,
    private readonly sse: SseService,
  ) {}

  async create(data: { name: string; phone: string; content?: string; source?: string }) {
    const entity = await this.repo.save(
      this.repo.create({ ...data, source: data.source || 'website' })
    );
    // ★ 广播新咨询事件给所有在线后台用户
    this.sse.broadcast('new-inquiry', {
      id:        entity.id,
      name:      entity.name,
      phone:     entity.phone,
      content:   entity.content,
      createdAt: entity.createdAt,
    });
    return entity;
  }

  async findAll(q: { status?: number; isRead?: number; page?: number; pageSize?: number }) {
    const { status, isRead, page = 1, pageSize = 20 } = q;
    const qb = this.repo.createQueryBuilder('q').orderBy('q.created_at', 'DESC');
    if (status !== undefined) qb.andWhere('q.status = :status', { status });
    if (isRead !== undefined) qb.andWhere('q.is_read = :isRead', { isRead });
    const total = await qb.getCount();
    const list  = await qb.skip((page - 1) * pageSize).take(pageSize).getMany();
    return { list, total, page, pageSize };
  }

  async unreadCount() {
    return this.repo.count({ where: { isRead: 0 } });
  }

  async markRead(ids: number[]) {
    if (!ids?.length) return;
    await this.repo.createQueryBuilder().update()
      .set({ isRead: 1, readAt: new Date() })
      .whereInIds(ids).andWhere('is_read = 0').execute();
  }

  async followUp(id: number, op: { id: number; name: string }) {
    await this.repo.update(id, { status: 1, followBy: op.id, followName: op.name, followAt: new Date() });
    return this.repo.findOne({ where: { id } });
  }

  async markDone(id: number) {
    await this.repo.update(id, { status: 2 });
    return this.repo.findOne({ where: { id } });
  }

  async addReply(id: number, content: string, op: { id: number; name: string }) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new Error('记录不存在');
    const replies: ReplyRecord[] = Array.isArray(item.replies) ? item.replies : [];
    replies.push({ content, operator: op.name, operatorId: op.id, createdAt: new Date().toISOString() });
    await this.repo.update(id, { replies });
    return this.repo.findOne({ where: { id } });
  }

  async recent(limit = 10) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  // ── 客户经理 ──────────────────────────────────────────
  async getManagers(onlyActive = false) {
    const where: any = onlyActive ? { isActive: 1 } : {};
    return this.managerRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  async saveManager(data: Partial<SiteManager> & { id?: number }) {
    const { id, ...rest } = data;
    if (id) {
      await this.managerRepo.update(id, rest);
      return this.managerRepo.findOne({ where: { id } });
    }
    return this.managerRepo.save(this.managerRepo.create(rest));
  }

  async deleteManager(id: number) {
    return this.managerRepo.delete(id);
  }
}

// ══════════════════════════════════════════════
// Inquiry Controller（含 SSE 端点）
// ══════════════════════════════════════════════
@Controller('inquiries')
export class InquiryController {
  constructor(
    private readonly svc: InquiryService,
    private readonly sse: SseService,
  ) {}

  // ★ SSE 长连接 — 前端后台页面连接此接口保持实时推送
  @Get('sse')
  handleSse(@Query('uid') uid: string, @Res() res: express.Response) {
    const clientId = uid || `client-${Date.now()}-${Math.random()}`;

    // 设置 SSE 响应头
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 关闭缓冲
    res.flushHeaders();

    // 发送连接成功事件
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

    // 注册客户端
    this.sse.register(clientId, res);

    // 客户端断开时清理
    res.on('close', () => {
      this.sse.remove(clientId);
      res.end();
    });
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.svc.create(body);
    return { code: 200, data, message: '提交成功，我们会尽快与您联系！' };
  }

  @Get()
  async findAll(@Query() q: any) {
    const data = await this.svc.findAll({
      status:   q.status   !== undefined ? Number(q.status)   : undefined,
      isRead:   q.isRead   !== undefined ? Number(q.isRead)   : undefined,
      page:     Number(q.page)     || 1,
      pageSize: Number(q.pageSize) || 20,
    });
    return { code: 200, data };
  }

  @Get('unread-count')
  async unreadCount() {
    const count = await this.svc.unreadCount();
    return { code: 200, data: { count } };
  }

  @Get('recent')
  async recent(@Query('limit') limit: string) {
    const data = await this.svc.recent(Number(limit) || 10);
    return { code: 200, data };
  }

  @Patch('read')
  async markRead(@Body('ids') ids: number[]) {
    await this.svc.markRead(ids);
    return { code: 200, message: 'ok' };
  }

  @Patch(':id/follow')
  async follow(@Param('id') id: string, @Body() body: any) {
    const data = await this.svc.followUp(+id, { id: body.operatorId, name: body.operatorName });
    return { code: 200, data };
  }

  @Patch(':id/done')
  async done(@Param('id') id: string) {
    const data = await this.svc.markDone(+id);
    return { code: 200, data };
  }

  @Post(':id/reply')
  async reply(@Param('id') id: string, @Body() body: any) {
    const data = await this.svc.addReply(+id, body.content, { id: body.operatorId, name: body.operatorName });
    return { code: 200, data };
  }
}

// ── 客户经理 Controller ───────────────────────────────────
@Controller('site/managers')
export class ManagerController {
  constructor(private readonly svc: InquiryService) {}

  @Get()
  async list(@Query('all') all: string) {
    const data = await this.svc.getManagers(all !== '1');
    return { code: 200, data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.svc.saveManager(body);
    return { code: 200, data };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const data = await this.svc.saveManager({ ...body, id });
    return { code: 200, data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.svc.deleteManager(id);
    return { code: 200, message: '已删除' };
  }
}

// ══════════════════════════════════════════════
// Module
// ══════════════════════════════════════════════
@Module({
  imports: [TypeOrmModule.forFeature([SiteInquiry, SiteManager])],
  controllers: [InquiryController, ManagerController],
  providers:   [InquiryService, SseService],
  exports:     [InquiryService, SseService],
})
export class InquiryModule {}