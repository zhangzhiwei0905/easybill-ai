import {
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterTransactionDto {
  @ApiProperty({
    description: '交易类型',
    enum: ['INCOME', 'EXPENSE'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: string;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '搜索关键词（备注）', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
