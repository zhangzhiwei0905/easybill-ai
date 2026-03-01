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

    @ApiPropertyOptional({
        example: 'HIGH_ONLY',
        enum: ['HIGH_ONLY', 'HIGH_AND_MEDIUM', 'MANUAL_ONLY'],
        description: 'Auto-confirm threshold: HIGH_ONLY (only HIGH confidence), HIGH_AND_MEDIUM (HIGH and MEDIUM), MANUAL_ONLY (all manual)'
    })
    @IsOptional()
    @IsString()
    @IsIn(['HIGH_ONLY', 'HIGH_AND_MEDIUM', 'MANUAL_ONLY'])
    autoConfirmThreshold?: string;
}
