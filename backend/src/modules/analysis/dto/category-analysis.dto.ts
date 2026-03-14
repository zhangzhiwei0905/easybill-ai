import { ApiProperty } from '@nestjs/swagger';

export class CategoryAnalysisDto {
  @ApiProperty({ description: '分类ID' })
  categoryId: string;

  @ApiProperty({ description: '分类名称' })
  categoryName: string;

  @ApiProperty({ description: '图标' })
  icon: string;

  @ApiProperty({ description: '颜色类' })
  colorClass: string;

  @ApiProperty({ description: '金额' })
  amount: number;

  @ApiProperty({ description: '交易次数' })
  count: number;

  @ApiProperty({ description: '占总支出百分比' })
  percentage: number;

  @ApiProperty({ description: '趋势', enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';

  @ApiProperty({ description: '较上期变化金额' })
  changeAmount: number;

  @ApiProperty({ description: '较上期变化百分比' })
  changePercentage: number;
}