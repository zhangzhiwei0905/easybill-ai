import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  const userId = 'user-123';
  const categoryId = 'category-123';
  const transactionId = 'transaction-123';

  const mockTransaction = {
    id: transactionId,
    userId,
    type: 'EXPENSE',
    amount: new Decimal(-100),
    categoryId,
    transactionDate: new Date('2026-02-25'),
    description: 'Test transaction',
    accountId: null,
    aiItemId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: categoryId,
      name: '餐饮美食',
      icon: '🍔',
      color: '#FF6B6B',
      type: 'EXPENSE',
    },
  };

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction successfully', async () => {
      const createDto = {
        type: 'EXPENSE',
        amount: 100,
        categoryId,
        date: '2026-02-25',
        description: 'Test transaction',
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(mockTransaction);
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          type: createDto.type,
          amount: -100,
          categoryId: createDto.categoryId,
          transactionDate: new Date(createDto.date),
          description: createDto.description,
        },
        include: { category: true },
      });
    });

    it('should store expense as negative amount', async () => {
      const createDto = {
        type: 'EXPENSE',
        amount: 100,
        categoryId,
        date: '2026-02-25',
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      await service.create(userId, createDto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: -100,
          }),
        }),
      );
    });

    it('should store income as positive amount', async () => {
      const createDto = {
        type: 'INCOME',
        amount: 100,
        categoryId,
        date: '2026-02-25',
      };

      const incomeTransaction = { ...mockTransaction, type: 'INCOME', amount: new Decimal(100) };
      mockPrismaService.transaction.create.mockResolvedValue(incomeTransaction);

      await service.create(userId, createDto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 100,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([mockTransaction]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, pageSize: 20 });

      expect(result.data).toEqual([mockTransaction]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by type', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([mockTransaction]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      await service.findAll(userId, { type: 'EXPENSE', page: 1, pageSize: 20 });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'EXPENSE',
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([mockTransaction]);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      await service.findAll(userId, {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        page: 1,
        pageSize: 20,
      });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            transactionDate: {
              gte: new Date('2026-02-01'),
              lte: new Date('2026-02-28'),
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await service.findOne(userId, transactionId);

      expect(result).toEqual(mockTransaction);
      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId },
        include: { category: true },
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, transactionId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if transaction belongs to another user', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        userId: 'another-user',
      });

      await expect(service.findOne(userId, transactionId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a transaction successfully', async () => {
      const updateDto = {
        amount: 200,
        description: 'Updated transaction',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        ...updateDto,
      });

      const result = await service.update(userId, transactionId, updateDto);

      expect(result.description).toBe(updateDto.description);
      expect(prisma.transaction.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, transactionId, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a transaction successfully', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.delete.mockResolvedValue(mockTransaction);

      await service.remove(userId, transactionId);

      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: transactionId },
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, transactionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('should return transaction summary', async () => {
      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(5000) },
        _count: { id: 50 },
      });

      mockPrismaService.transaction.groupBy.mockResolvedValue([
        {
          categoryId,
          _sum: { amount: new Decimal(1500) },
          _count: { id: 20 },
        },
      ]);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        { ...mockTransaction, category: { name: '餐饮美食' } },
      ]);

      const result = await service.getSummary(userId);

      expect(result).toHaveProperty('totalIncome');
      expect(result).toHaveProperty('totalExpense');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('transactionCount');
      expect(result).toHaveProperty('categoryStats');
    });
  });
});
