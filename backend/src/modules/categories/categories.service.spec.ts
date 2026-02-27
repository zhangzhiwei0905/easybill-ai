import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockCategories = [
    {
      id: '1',
      name: '餐饮美食',
      icon: '🍔',
      color: '#FF6B6B',
      type: 'EXPENSE',
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: '工资收入',
      icon: '💰',
      color: '#4ECDC4',
      type: 'INCOME',
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories when no type filter', async () => {
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return filtered categories by type', async () => {
      const expenseCategories = [mockCategories[0]];
      mockPrismaService.category.findMany.mockResolvedValue(expenseCategories);

      const result = await service.findAll('EXPENSE');

      expect(result).toEqual(expenseCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { type: 'EXPENSE' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });
});
