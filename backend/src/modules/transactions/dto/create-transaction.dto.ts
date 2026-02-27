import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: '交易类型', enum: ['INCOME', 'EXPENSE'] })
  @IsNotEmpty()
  @IsEnum(['INCOME', 'EXPENSE'])
  type: string;

  @ApiProperty({ description: '金额（正数）' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: '分类ID' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: '交易日期', example: '2024-01-01' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '账户ID', required: false })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}
