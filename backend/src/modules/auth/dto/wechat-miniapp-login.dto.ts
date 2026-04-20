import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class WechatMiniappLoginDto {
  @ApiProperty({
    example: '021xYzAbCdEfGhIjKlMnOpQrStUvWxY',
    description: 'wx.login() 返回的小程序登录 code',
  })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiPropertyOptional({ example: '微信用户' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
