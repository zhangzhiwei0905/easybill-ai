import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '888888' })
    @IsString()
    @MinLength(4)
    @MaxLength(6)
    code: string;

    @ApiProperty({ example: 'newSecurePassword123' })
    @IsString()
    @MinLength(6)
    newPassword: string;
}
