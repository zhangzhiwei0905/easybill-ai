import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  SendCodeDto,
  ResetPasswordDto,
  WechatMiniappLoginDto,
} from './dto';

interface WechatSessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

const WECHAT_MINIAPP_PROVIDER = 'WECHAT_MINIAPP';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Generate Webhook Key ──────────────────────────────────────────
  private generateWebhookKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ── Register ──────────────────────────────────────────
  async register(dto: RegisterDto) {
    // 1. Verify code
    await this.verifyCode(dto.email, dto.code, 'REGISTER');

    // 2. Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 3. Hash password and create user with webhook key
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const webhookKey = this.generateWebhookKey();
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        webhookKey,
      },
    });

    // 4. Create default preferences
    await this.prisma.userPreference.create({
      data: { userId: user.id },
    });

    // 5. Mark code as used
    await this.markCodeUsed(dto.email, dto.code, 'REGISTER');

    // 6. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ── Login ─────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ── WeChat Miniapp Login ─────────────────────────────
  async loginWithWechatMiniapp(dto: WechatMiniappLoginDto) {
    const appId = this.configService.get<string>('oauth.wechat.appId');
    const appSecret = this.configService.get<string>('oauth.wechat.appSecret');

    if (!appId || !appSecret) {
      throw new BadRequestException('微信小程序登录未配置');
    }

    const session = await this.exchangeWechatMiniappCode(
      dto.code,
      appId,
      appSecret,
    );

    if (!session.openid) {
      throw new UnauthorizedException('微信登录失败');
    }
    const openid = session.openid;
    const trimmedNickname = dto.nickname?.trim();

    const existingOauthAccount = await this.prisma.oauthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: WECHAT_MINIAPP_PROVIDER,
          providerUserId: openid,
        },
      },
      include: {
        user: true,
      },
    });

    let user = existingOauthAccount?.user;

    if (!user) {
      user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: null,
            name: this.buildWechatDisplayName(trimmedNickname, openid),
            avatarUrl: dto.avatarUrl,
            webhookKey: this.generateWebhookKey(),
          },
        });

        await tx.userPreference.create({
          data: { userId: createdUser.id },
        });

        await tx.oauthAccount.create({
          data: {
            userId: createdUser.id,
            provider: WECHAT_MINIAPP_PROVIDER,
            providerUserId: openid,
          },
        });

        return createdUser;
      });
    } else if (
      (trimmedNickname && trimmedNickname !== user.name) ||
      (dto.avatarUrl && dto.avatarUrl !== user.avatarUrl)
    ) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(trimmedNickname ? { name: trimmedNickname } : {}),
          ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ── Send Verification Code ────────────────────────────
  async sendCode(dto: SendCodeDto) {
    // For registration, check email not already taken
    if (dto.purpose === 'REGISTER') {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('该邮箱已被注册');
      }
    }

    // For reset password, check email exists
    if (dto.purpose === 'RESET_PASSWORD') {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!existing) {
        throw new BadRequestException('该邮箱未注册');
      }
    }

    // Rate limiting: check if a code was sent in the last 60 seconds
    const recentCode = await this.prisma.verificationCode.findFirst({
      where: {
        email: dto.email,
        purpose: dto.purpose,
        isUsed: false,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recentCode) {
      throw new BadRequestException('验证码发送过于频繁，请60秒后再试');
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in database with 10 minute expiration
    await this.prisma.verificationCode.create({
      data: {
        email: dto.email,
        code,
        purpose: dto.purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // TODO: Send email via SMTP in production
    this.logger.log(`Verification code for ${dto.email}: ${code}`);

    // Return the code in response for frontend display
    return { message: '验证码已发送', code };
  }

  // ── Reset Password ────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    // 1. Verify code
    await this.verifyCode(dto.email, dto.code, 'RESET_PASSWORD');

    // 2. Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 3. Update password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash },
    });

    // 4. Mark code as used
    await this.markCodeUsed(dto.email, dto.code, 'RESET_PASSWORD');

    return { message: '密码重置成功' };
  }

  // ── Refresh Token ─────────────────────────────────────
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const tokens = await this.generateTokens(user.id, user.email);
      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token 无效或已过期');
    }
  }

  // ── Get Current User ──────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return this.sanitizeUser(user);
  }

  // ── Get Webhook Key ──────────────────────────────────
  async getWebhookKey(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { webhookKey: true },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return { webhookKey: user.webhookKey };
  }

  // ── Regenerate Webhook Key ──────────────────────────────────
  async regenerateWebhookKey(userId: string) {
    const newWebhookKey = this.generateWebhookKey();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { webhookKey: newWebhookKey },
      select: { webhookKey: true },
    });
    return { webhookKey: user.webhookKey };
  }

  // ── Helper Methods ────────────────────────────────────

  private async verifyCode(email: string, code: string, purpose: string) {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        purpose,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      throw new BadRequestException('验证码无效或已过期');
    }

    return verificationCode;
  }

  private async markCodeUsed(email: string, code: string, purpose: string) {
    await this.prisma.verificationCode.updateMany({
      where: { email, code, purpose },
      data: { isUsed: true },
    });
  }

  private async generateTokens(userId: string, email: string | null) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatarUrl,
      isPro: user.isPro,
      webhookKey: user.webhookKey,
    };
  }

  private async exchangeWechatMiniappCode(
    code: string,
    appId: string,
    appSecret: string,
  ): Promise<WechatSessionResponse> {
    const params = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('微信登录失败');
    }

    const data = (await response.json()) as WechatSessionResponse;

    if (data.errcode || !data.openid) {
      this.logger.warn(
        `Wechat miniapp login failed: ${data.errcode ?? 'unknown'} ${data.errmsg ?? ''}`,
      );
      throw new UnauthorizedException(data.errmsg || '微信登录失败');
    }

    return data;
  }

  private buildWechatDisplayName(
    nickname: string | undefined,
    openid: string,
  ): string {
    if (nickname) {
      return nickname;
    }

    return `微信用户${openid.slice(-6)}`;
  }
}
