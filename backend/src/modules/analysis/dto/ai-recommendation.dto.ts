import { ApiProperty } from '@nestjs/swagger';

export class AiRecommendationDto {
  @ApiProperty({ description: '分类' })
  category: string;

  @ApiProperty({ description: '具体建议' })
  suggestion: string;

  @ApiProperty({ description: '预计节省金额' })
  potentialSavings: number;

  @ApiProperty({ description: '优先级', enum: ['high', 'medium', 'low'] })
  priority: 'high' | 'medium' | 'low';

  @ApiProperty({ description: '可行性评分 (1-10)' })
  feasibilityScore: number;

  @ApiProperty({ description: '实施难度', enum: ['easy', 'medium', 'hard'] })
  difficulty: 'easy' | 'medium' | 'hard';
}

export class AiRecommendationsDto {
  @ApiProperty({ description: '总体状况总结' })
  summary: string;

  @ApiProperty({ description: '洞察点', type: [String] })
  insights: string[];

  @ApiProperty({ description: '建议', type: [AiRecommendationDto] })
  recommendations: AiRecommendationDto[];

  @ApiProperty({ description: '风险警告', type: [String] })
  riskWarnings: string[];

  @ApiProperty({ description: '下月预算建议' })
  nextMonthBudget: Record<string, number>;

  @ApiProperty({ description: '总体评分 (1-10)' })
  overallScore: number;

  @ApiProperty({ description: '分析月数' })
  months: number;
}