import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changePassword', () => {
    it('rejects password changes for wechat-only accounts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: null,
      });

      await expect(
        service.changePassword('user-1', {
          oldPassword: 'old-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates password for password-based accounts', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'old-hash',
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.changePassword('user-1', {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed-password' },
      });
      expect(result).toEqual({ message: '密码修改成功' });
    });
  });
});
