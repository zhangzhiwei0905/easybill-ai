import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: '张智为' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsUrl()
    avatarUrl?: string;
}
