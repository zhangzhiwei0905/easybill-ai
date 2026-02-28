import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Header,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  FilterTransactionDto,
  DashboardSummaryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Readable } from 'stream';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: '创建交易记录' })
  async create(@Req() req, @Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取交易记录列表' })
  async findAll(@Req() req, @Query() filterDto: FilterTransactionDto) {
    return this.transactionsService.findAll(req.user.id, filterDto);
  }

  @Get('export')
  @ApiOperation({ summary: '导出交易记录为CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="transactions.csv"')
  async export(@Req() req, @Query() filterDto: FilterTransactionDto) {
    const csv = await this.transactionsService.exportToCsv(
      req.user.id,
      filterDto,
    );
    // Add BOM for Excel to recognize UTF-8
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;
    const stream = Readable.from(csvWithBom);
    return new StreamableFile(stream);
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: '获取 Dashboard 统计摘要（全部时间 + 当月）' })
  @ApiQuery({ name: 'monthStart', required: false })
  @ApiQuery({ name: 'monthEnd', required: false })
  async getDashboardSummary(
    @Req() req,
    @Query('monthStart') monthStart?: string,
    @Query('monthEnd') monthEnd?: string,
  ) {
    return this.transactionsService.getDashboardSummary(
      req.user.id,
      monthStart,
      monthEnd,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个交易记录' })
  async findOne(@Req() req, @Param('id') id: string) {
    return this.transactionsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新交易记录' })
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除交易记录' })
  async remove(@Req() req, @Param('id') id: string) {
    await this.transactionsService.remove(req.user.id, id);
    return { message: '删除成功' };
  }
}
