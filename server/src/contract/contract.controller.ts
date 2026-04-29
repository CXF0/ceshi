/**
 * @file server/src/contract/contract.controller.ts
 * @version 2.0.0 [2026-04-28]
 * @desc 补充 GET /:id 单条查询、PATCH /:id/status 状态流转
 */
import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ContractService } from './contract.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  /** 列表查询 */
  @Get()
  async findAll(@Query() query: any, @Req() req: any) {
    const result = await this.contractService.findAll(query, req.user);
    return { code: 200, msg: 'success', data: result };
  }

  /** 单条详情 GET /api/contracts/:id */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.contractService.findOne(id);
    return { code: 200, msg: 'success', data };
  }

  /** 起草新合同 */
  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const result = await this.contractService.create(body, req.user);
    return { code: 200, msg: '起草成功', data: result };
  }

  /** 更新合同 */
  @Put(':id')
  async update(@Param('id') id: number, @Body() body: any) {
    await this.contractService.update(Number(id), body);
    return { code: 200, msg: '更新成功' };
  }

  /** 状态流转 PATCH /api/contracts/:id/status */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const data = await this.contractService.updateStatus(Number(id), status);
    return { code: 200, msg: '状态更新成功', data };
  }

  /** 删除合同 */
  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.contractService.remove(Number(id));
    return { code: 200, msg: '删除成功' };
  }

  /** 附件上传（支持多次调用，每次上传一个文件） */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'contracts'),
      filename: (req, file, callback) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = extname(originalName);
        const baseName = originalName.replace(ext, '');
        callback(null, `${Date.now()}-${baseName}${ext}`);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      code: 200,
      msg: '上传成功',
      data: {
        name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        url:  `/static/contracts/${file.filename}`,
        size: file.size,
      },
    };
  }
}