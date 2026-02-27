import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class ParseSmsDto {
  @ApiProperty({
    description: '原始短信文本',
    example:
      '【招商银行】您尾号8888的账户于02月27日14:30支出128.50元，商户名称:美团外卖。',
  })
  @IsString()
  @IsNotEmpty()
  rawText: string;

  @ApiProperty({ description: '用户ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: '用户专属 Webhook Key',
    example: '64位十六进制字符串',
  })
  @IsString()
  @IsNotEmpty()
  webhookKey: string;
}
