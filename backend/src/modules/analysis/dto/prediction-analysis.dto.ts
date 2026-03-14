import { ApiProperty } from '@nestjs/swagger';

export class PredictionAnalysisDto {
  @ApiProperty({ description: '预计本月总支出' })
  monthEndExpense: number;

  @ApiProperty({ description: '当前支出' })
  currentExpense: number;

  @ApiProperty({ description: '剩余预算' })
  remainingBudget: number;

  @ApiProperty({ description: '风险等级', enum: ['low', 'medium', 'high'] })
  riskLevel: 'low' | 'medium' | 'high';

  @ApiProperty({ description: '预算利用率' })
  budgetUtilization: number;

  @ApiProperty({ description: '预计超支金额' })
  predictedOverspend: number;

  @ApiProperty({ description: '日均支出' })
  dailyAverage: number;

  @ApiProperty({ description: '预测准确度' })
  confidence: number;
}