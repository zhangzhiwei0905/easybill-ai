import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransactionDto {
  @ApiProperty({
    description: '交易类型',
    enum: ['INCOME', 'EXPENSE'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: string;

  @ApiProperty({ description: '金额', required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: '交易日期', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
