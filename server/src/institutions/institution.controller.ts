import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe // 💡 引入管道
} from '@nestjs/common';
import { InstitutionService } from './institution.service';

@Controller('institutions')
export class InstitutionController {
  constructor(private readonly service: InstitutionService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.service.findAll(query);
    return { code: 200, data, message: 'success' };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) { // 💡 自动转为 number
    const data = await this.service.findOne(id);
    return { code: 200, data, message: 'success' };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.service.create(body);
    return { code: 200, data, message: '创建成功' };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { // 💡 自动转为 number
    const data = await this.service.update(id, body);
    return { code: 200, data, message: '更新成功' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) { // 💡 自动转为 number
    await this.service.remove(id);
    return { code: 200, message: '删除成功' };
  }
}