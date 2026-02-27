import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class UpdateAiItemDto {
  @ApiProperty({
    description: '交易类型',
    enum: ['EXPENSE', 'INCOME'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['EXPENSE', 'INCOME'])
  type?: string;

  @ApiProperty({ description: '金额', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '交易日期', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class ConfirmAiItemDto {
  @ApiProperty({
    description: '交易类型',
    enum: ['EXPENSE', 'INCOME'],
  })
  @IsEnum(['EXPENSE', 'INCOME'])
  type: string;

  @ApiProperty({ description: '金额' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: '描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '交易日期' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '分类ID' })
  @IsUUID()
  categoryId: string;
}
