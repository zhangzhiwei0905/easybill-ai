import { ApiProperty } from '@nestjs/swagger';

export class AnalysisSummaryDto {
  @ApiProperty({ description: '总收入' })
  totalIncome: number;

  @ApiProperty({ description: '总支出' })
  totalExpense: number;

  @ApiProperty({ description: '净储蓄' })
  netSavings: number;

  @ApiProperty({ description: '月均支出' })
  averageMonthlyExpense: number;

  @ApiProperty({ description: '预算利用率' })
  budgetUtilization: number;

  @ApiProperty({ description: '分析月数' })
  months: number;

  @ApiProperty({ description: '交易总数' })
  transactionCount: number;
}