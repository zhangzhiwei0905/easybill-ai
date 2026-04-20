import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userPreference: {
      create: jest.fn(),
    },
    oauthAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    verificationCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    mockConfigService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        'oauth.wechat.appId': 'wx-app-id',
        'oauth.wechat.appSecret': 'wx-app-secret',
        'jwt.secret': 'jwt-secret',
        'jwt.refreshSecret': 'jwt-refresh-secret',
      };
      return values[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new user on first wechat miniapp login', async () => {
    const createdUser = {
      id: 'user-1',
      email: null,
      name: 'EasyBill WeChat',
      avatarUrl: 'https://example.com/avatar.jpg',
      isPro: false,
      webhookKey: 'webhook-key',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ openid: 'openid-123' }),
    }) as typeof fetch;

    mockPrismaService.oauthAccount.findUnique.mockResolvedValue(null);
    mockPrismaService.$transaction.mockImplementation(async (callback: (tx: typeof mockPrismaService) => Promise<unknown>) =>
      callback({
        user: {
          create: jest.fn().mockResolvedValue(createdUser),
        },
        userPreference: {
          create: jest.fn().mockResolvedValue({}),
        },
        oauthAccount: {
          create: jest.fn().mockResolvedValue({}),
        },
      } as unknown as typeof mockPrismaService),
    );

    const result = await service.loginWithWechatMiniapp({
      code: 'wechat-code',
      nickname: 'EasyBill WeChat',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    expect(result.user).toEqual({
      id: 'user-1',
      email: null,
      name: 'EasyBill WeChat',
      avatar: 'https://example.com/avatar.jpg',
      isPro: false,
      webhookKey: 'webhook-key',
    });
    expect(result.accessToken).toBe('access-token');
    expect(mockPrismaService.oauthAccount.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerUserId: {
          provider: 'WECHAT_MINIAPP',
          providerUserId: 'openid-123',
        },
      },
      include: { user: true },
    });
  });

  it('reuses an existing wechat linked user', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ openid: 'openid-123' }),
    }) as typeof fetch;

    mockPrismaService.oauthAccount.findUnique.mockResolvedValue({
      userId: 'user-1',
      user: {
        id: 'user-1',
        email: null,
        name: 'Existing User',
        avatarUrl: null,
        isPro: false,
        webhookKey: 'webhook-key',
      },
    });

    const result = await service.loginWithWechatMiniapp({ code: 'wechat-code' });

    expect(result.user.id).toBe('user-1');
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('throws when wechat config is missing', async () => {
    mockConfigService.get.mockReturnValue(undefined);

    await expect(
      service.loginWithWechatMiniapp({ code: 'wechat-code' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when wechat returns an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ errcode: 40029, errmsg: 'invalid code' }),
    }) as typeof fetch;

    await expect(
      service.loginWithWechatMiniapp({ code: 'bad-code' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
