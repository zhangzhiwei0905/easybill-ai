import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiItemsService } from './ai-items.service';
import {
  ParseSmsDto,
  UpdateAiItemDto,
  ConfirmAiItemDto,
  FilterAiItemDto,
  BatchConfirmDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI Items')
@Controller('ai-items')
export class AiItemsController {
  constructor(private readonly aiItemsService: AiItemsService) {}

  /**
   * Webhook 接口 - 接收短信并解析
   * 使用用户专属 Webhook Key 认证
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook 接口 - 接收短信并解析（用户专属 Webhook Key 认证）',
  })
  async webhook(@Body() parseDto: ParseSmsDto) {
    // 验证用户的 Webhook Key
    const isValid = await this.aiItemsService.validateWebhookKey(
      parseDto.userId,
      parseDto.webhookKey,
    );

    if (!isValid) {
      throw new UnauthorizedException('无效的 Webhook Key 或用户不存在');
    }

    const result = await this.aiItemsService.parseAndCreate(parseDto);
    return result;
  }

  /**
   * 获取待审核列表
   */
  @Get()
  @ApiOperation({ summary: '获取待审核列表' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req, @Query() filterDto: FilterAiItemDto) {
    return this.aiItemsService.findAll(req.user.id, filterDto);
  }

  /**
   * 获取 AI 统计数据
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取 AI 解析统计数据' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Req() req) {
    return this.aiItemsService.getStatistics(req.user.id);
  }

  /**
   * 获取单个待审核项
   */
  @Get(':id')
  @ApiOperation({ summary: '获取单个待审核项' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findOne(@Req() req, @Param('id') id: string) {
    return this.aiItemsService.findOne(req.user.id, id);
  }

  /**
   * 更新待审核项
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新待审核项' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateAiItemDto,
  ) {
    return this.aiItemsService.update(req.user.id, id, updateDto);
  }

  /**
   * 确认入账
   */
  @Post(':id/confirm')
  @ApiOperation({ summary: '确认入账' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async confirm(
    @Req() req,
    @Param('id') id: string,
    @Body() confirmDto: ConfirmAiItemDto,
  ) {
    return this.aiItemsService.confirm(req.user.id, id, confirmDto);
  }

  /**
   * 批量确认入账
   */
  @Post('batch-confirm')
  @ApiOperation({ summary: '批量确认入账' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async confirmBatch(@Req() req, @Body() batchDto: BatchConfirmDto) {
    return this.aiItemsService.confirmBatch(req.user.id, batchDto);
  }

  /**
   * 删除待审核项（标记为拒绝）
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除待审核项（标记为拒绝）' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req, @Param('id') id: string) {
    await this.aiItemsService.remove(req.user.id, id);
    return { message: '已删除' };
  }
}
