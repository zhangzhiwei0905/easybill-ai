import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 单个确认项的数据
 */
export class ConfirmItemDto {
  @ApiProperty({ description: '待审核项 ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: '交易类型', enum: ['EXPENSE', 'INCOME'] })
  @IsEnum(['EXPENSE', 'INCOME'])
  type: 'EXPENSE' | 'INCOME';

  @ApiProperty({ description: '金额' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: '描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '交易日期 (ISO 8601 格式)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '分类 ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

/**
 * 批量确认 DTO
 */
export class BatchConfirmDto {
  @ApiProperty({ description: '待确认的记录列表', type: [ConfirmItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmItemDto)
  items: ConfirmItemDto[];
}
