import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AnalysisQueryDto {
  @ApiPropertyOptional({
    description: '分析月数',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => parseInt(value, 10))
  months?: number = 3;
}