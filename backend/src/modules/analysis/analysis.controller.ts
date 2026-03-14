import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';
import { AnalysisQueryDto } from './dto/analysis-query.dto';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analysisService: AnalysisService) {}

  @Get('summary')
  @ApiOperation({ summary: '获取分析概览' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: '分析月数，默认3个月' })
  async getSummary(@Req() req, @Query() queryDto: AnalysisQueryDto) {
    this.logger.log(`Getting analysis summary for user ${req.user.id} with ${queryDto.months || 3} months`);
    return this.analysisService.getAnalysisSummary(req.user.id, queryDto.months || 3);
  }

  @Get('trends')
  @ApiOperation({ summary: '获取趋势分析' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: '分析月数，默认3个月' })
  async getTrends(@Req() req, @Query() queryDto: AnalysisQueryDto) {
    this.logger.log(`Getting trend analysis for user ${req.user.id} with ${queryDto.months || 3} months`);
    return this.analysisService.getTrendAnalysis(req.user.id, queryDto.months || 3);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取分类分析' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: '分析月数，默认3个月' })
  async getCategories(@Req() req, @Query() queryDto: AnalysisQueryDto) {
    this.logger.log(`Getting category analysis for user ${req.user.id} with ${queryDto.months || 3} months`);
    return this.analysisService.getCategoryAnalysis(req.user.id, queryDto.months || 3);
  }

  @Get('predictions')
  @ApiOperation({ summary: '获取支出预测' })
  async getPredictions(@Req() req) {
    this.logger.log(`Getting predictions for user ${req.user.id}`);
    return this.analysisService.getPredictions(req.user.id);
  }

  @Get('recommendations')
  @ApiOperation({ summary: '获取AI建议' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: '分析月数，默认3个月' })
  async getRecommendations(@Req() req, @Query() queryDto: AnalysisQueryDto) {
    this.logger.log(`Getting AI recommendations for user ${req.user.id} with ${queryDto.months || 3} months`);
    return this.analysisService.getAiRecommendations(req.user.id, queryDto.months || 3);
  }
}