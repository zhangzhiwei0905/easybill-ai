import { IsEmail, IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendCodeDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'REGISTER', enum: ['REGISTER', 'RESET_PASSWORD'] })
    @IsString()
    @IsIn(['REGISTER', 'RESET_PASSWORD'])
    purpose: 'REGISTER' | 'RESET_PASSWORD';
}
