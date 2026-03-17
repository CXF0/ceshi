import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Param,
  Body, 
  Query, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { CrmCustomer } from './crm-customer.entity';

@Controller('crm/customers')
@UseGuards(JwtAuthGuard) 
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  /**
   * 获取客户列表
   * 支持分页、名称模糊搜索、来源/行业/等级筛选
   * GET /api/crm/customers
   */
  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    // 💡 这里的 query 会包含前端传来的所有字段：name, source, industry, level, page, pageSize
    return this.crmService.findAll(req.user, { 
      ...query, 
      page: Number(query.page) || 1, 
      pageSize: Number(query.pageSize) || 10 
    });
  }

  /**
   * 创建客户
   * POST /api/crm/customers
   */
  @Post()
  async create(@Req() req: any, @Body() customerData: Partial<CrmCustomer>) {
    return this.crmService.create(req.user, customerData);
  }

  /**
   * 更新客户信息
   * PUT /api/crm/customers/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Req() req: any, 
    @Body() updateDto: any
  ) {
    // 将 id 转为 number 后传给 Service 进行权限检查和更新
    return this.crmService.update(Number(id), req.user, updateDto);
  }

  /**
   * 获取单个客户详情 (如果前端需要详情页可增加此接口)
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.crmService.findOne(Number(id), req.user);
  }
}