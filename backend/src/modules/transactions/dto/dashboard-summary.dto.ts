import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiPropertyOptional({ description: '当月开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  monthStart?: string;

  @ApiPropertyOptional({ description: '当月结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  monthEnd?: string;
}
