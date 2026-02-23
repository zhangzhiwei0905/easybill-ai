import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'securePassword123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '张三' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @ApiProperty({ example: '888888' })
    @IsString()
    @MinLength(4)
    @MaxLength(6)
    code: string;
}
