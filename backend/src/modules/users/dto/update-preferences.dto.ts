import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
    @ApiPropertyOptional({ example: 'CNY' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ example: 'zh' })
    @IsOptional()
    @IsString()
    language?: string;

    @ApiPropertyOptional({ example: 'light', enum: ['light', 'dark', 'system'] })
    @IsOptional()
    @IsString()
    @IsIn(['light', 'dark', 'system'])
    theme?: string;
}
