import {
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  IsIn,
  IsNumber,
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

  @ApiProperty({
    description: '来源类型',
    enum: ['AI_EXTRACTED', 'MANUAL'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['AI_EXTRACTED', 'MANUAL'])
  source?: string;

  @ApiProperty({
    description: '排序字段',
    enum: ['date', 'amount', 'createdAt'],
    required: false,
    default: 'date',
  })
  @IsOptional()
  @IsIn(['date', 'amount', 'createdAt'])
  sortBy?: string;

  @ApiProperty({
    description: '排序方向',
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;

  @ApiProperty({ description: '最小金额（绝对值）', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({ description: '最大金额（绝对值）', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}
