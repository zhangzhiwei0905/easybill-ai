import { ApiProperty } from '@nestjs/swagger';

export class MonthlyTrendDto {
  @ApiProperty({ description: '月份' })
  month: string;

  @ApiProperty({ description: '收入' })
  income: number;

  @ApiProperty({ description: '支出' })
  expense: number;

  @ApiProperty({ description: '净额' })
  net: number;
}

export class CategoryTrendDto {
  @ApiProperty({ description: '分类名称' })
  category: string;

  @ApiProperty({ description: '金额' })
  amount: number;

  @ApiProperty({ description: '百分比' })
  percentage: number;

  @ApiProperty({ description: '趋势', enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';

  @ApiProperty({ description: '分类ID' })
  categoryId: string;

  @ApiProperty({ description: '图标' })
  icon: string;

  @ApiProperty({ description: '颜色类' })
  colorClass: string;
}

export class TrendAnalysisDto {
  @ApiProperty({ description: '月度趋势', type: [MonthlyTrendDto] })
  monthly: MonthlyTrendDto[];

  @ApiProperty({ description: '分类趋势', type: [CategoryTrendDto] })
  categories: CategoryTrendDto[];
}