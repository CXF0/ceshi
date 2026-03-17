import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, 
  UseInterceptors, UploadedFile 
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

  // 1. 分页查询列表
  @Get()
  async findAll(@Query() query: any, @Req() req) {
    const result = await this.contractService.findAll(query, req.user);
    return { code: 200, msg: 'success', data: result };
  }

  // 2. 新增合同 (对应前端的“起草合同”)
  @Post()
  async create(@Body() body: any, @Req() req) {
    const result = await this.contractService.create(body, req.user);
    return { code: 200, msg: '起草成功', data: result };
  }

  // 3. 更新合同 (对应前端的“保存修改”，解决你的 PUT 404 报错)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    await this.contractService.update(id, body);
    return { code: 200, msg: '更新成功' };
  }

  // 4. 删除合同 (可选补全)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.contractService.remove(id);
    return { code: 200, msg: '删除成功' };
  }

  // 5. 附件上传接口
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'), 
      filename: (req, file, callback) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = extname(file.originalname);
        const fileName = `${Date.now()}-${originalName}`;
  callback(null, fileName);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      code: 200,
      msg: '上传成功',
      url: `/static/${file.filename}`, 
    };
  }
}