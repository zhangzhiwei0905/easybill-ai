import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS = require('ali-oss');

@Injectable()
export class OssService {
  private readonly logger = new Logger(OssService.name);
  private client: OSS;
  private avatarPrefix: string;

  constructor(private configService: ConfigService) {
    this.client = new OSS({
      region: this.configService.get<string>('oss.region')!,
      accessKeyId: this.configService.get<string>('oss.accessKeyId')!,
      accessKeySecret: this.configService.get<string>(
        'oss.accessKeySecret',
      )!,
      bucket: this.configService.get<string>('oss.bucket')!,
    });
    this.avatarPrefix =
      this.configService.get<string>('oss.avatarPrefix') || 'avatars/';
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `${this.avatarPrefix}${userId}/${Date.now()}.${ext}`;

    const result = await this.client.put(key, file.buffer, {
      headers: {
        'Content-Type': file.mimetype,
      },
    });

    this.logger.log(`Avatar uploaded: ${result.url}`);
    return result.url;
  }
}
