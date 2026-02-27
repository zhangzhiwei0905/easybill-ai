import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterAiItemDto {
  @ApiProperty({ description: '状态', enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'NEEDS_MANUAL'], required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'REJECTED', 'NEEDS_MANUAL'])
  status?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
