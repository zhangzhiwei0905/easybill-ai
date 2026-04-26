import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  FilterTransactionDto,
} from './dto';
import { Transaction } from '@prisma/client';

/**
 * Attempt to parse a search string as a date pattern.
 * Returns { gte, lte } date range for Prisma filtering, or null if not a date pattern.
 */
function parseSearchDate(search: string): { gte: Date; lte: Date } | null {
  // Full date: YYYY-MM-DD or YYYY/MM/DD
  const fullDateMatch = search.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (fullDateMatch) {
    const [, year, month, day] = fullDateMatch;
    const y = parseInt(year);
    const m = parseInt(month) - 1;
    const d = parseInt(day);
    return {
      gte: new Date(y, m, d, 0, 0, 0),
      lte: new Date(y, m, d, 23, 59, 59, 999),
    };
  }

  // Year-month: YYYY-MM or YYYY/MM → match entire month
  const yearMonthMatch = search.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yearMonthMatch) {
    const [, year, month] = yearMonthMatch;
    const y = parseInt(year);
    const m = parseInt(month) - 1;
    return {
      gte: new Date(y, m, 1, 0, 0, 0),
      lte: new Date(y, m + 1, 0, 23, 59, 59, 999),
    };
  }

  // Month-day: MM-DD or M-D (assumes current year)
  const monthDayMatch = search.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (monthDayMatch) {
    const [, month, day] = monthDayMatch;
    const y = new Date().getFullYear();
    const m = parseInt(month) - 1;
    const d = parseInt(day);
    return {
      gte: new Date(y, m, d, 0, 0, 0),
      lte: new Date(y, m, d, 23, 59, 59, 999),
    };
  }

  return null;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { date, ...rest } = createDto;
    return this.prisma.transaction.create({
      data: {
        ...rest,
        transactionDate: new Date(date),
        source: 'MANUAL',
        userId,
        description: createDto.description || '',
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(userId: string, filterDto: FilterTransactionDto) {
    const {
      type,
      categoryId,
      startDate,
      endDate,
      search,
      page = 1,
      pageSize = 20,
      source,
      sortBy = 'date',
      sortOrder = 'desc',
      minAmount,
      maxAmount,
    } = filterDto;

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (source) {
      where.source = source;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    if (search) {
      const dateRange = parseSearchDate(search);

      if (dateRange) {
        // Search by date OR description when input matches a date pattern
        where.OR = [
          {
            transactionDate: {
              gte: dateRange.gte,
              lte: dateRange.lte,
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      } else {
        // Normal text search on description only
        where.description = {
          contains: search,
          mode: 'insensitive',
        };
      }
    }

    // Amount filter (compare absolute values)
    // Must use AND to avoid overwriting search OR conditions
    if (minAmount !== undefined || maxAmount !== undefined) {
      const expenseConditions: any = { type: 'EXPENSE' };
      if (minAmount !== undefined) {
        expenseConditions.amount = { gte: minAmount };
      }
      if (maxAmount !== undefined) {
        expenseConditions.amount = {
          ...expenseConditions.amount,
          lte: maxAmount,
        };
      }
      const incomeConditions: any = { type: 'INCOME' };
      if (minAmount !== undefined) {
        incomeConditions.amount = { gte: minAmount };
      }
      if (maxAmount !== undefined) {
        incomeConditions.amount = {
          ...incomeConditions.amount,
          lte: maxAmount,
        };
      }

      const amountFilter = {
        OR: [expenseConditions, incomeConditions],
      };

      if (where.OR) {
        // Search already set OR — combine with AND
        where.AND = [amountFilter];
      } else {
        // No search OR — set directly
        where.OR = amountFilter.OR;
      }
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Map sortBy to composite orderBy (add createdAt as tiebreaker)
    const order = sortOrder as 'asc' | 'desc';
    const orderBy =
      sortBy === 'date'
        ? [{ transactionDate: order }, { createdAt: order }]
        : sortBy === 'amount'
          ? [{ amount: order }, { createdAt: order }]
          : [{ createdAt: order }];

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('交易记录不存在');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('无权访问此交易记录');
    }

    return transaction;
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    await this.findOne(userId, id);

    const updateData: any = { ...updateDto };
    if (updateDto.date) {
      updateData.transactionDate = new Date(updateDto.date);
      delete updateData.date;
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    await this.prisma.transaction.delete({
      where: { id },
    });
  }

  async exportToCsv(
    userId: string,
    filterDto: FilterTransactionDto,
  ): Promise<string> {
    const { transactions } = await this.findAll(userId, {
      ...filterDto,
      page: 1,
      pageSize: 10000,
    });

    const headers = ['日期', '类型', '分类', '金额', '备注'];
    const rows = transactions.map((t) => [
      new Date(t.transactionDate).toISOString().split('T')[0],
      t.type === 'INCOME' ? '收入' : t.type === 'EXPENSE' ? '支出' : '转账',
      t.category.name,
      t.amount.toString(),
      t.description || '',
    ]);

    // Properly escape CSV fields (handle commas, quotes, and newlines)
    const escapeCsvField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvField).join(','))
      .join('\n');
    return csv;
  }

  async getSummary(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    const [income, expense, transactions] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const totalIncome = Number(income._sum.amount || 0);
    const totalExpense = Math.abs(Number(expense._sum.amount || 0));
    const balance = totalIncome - totalExpense;

    const categoryStats = transactions.reduce(
      (acc, t) => {
        const categoryName = t.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = { amount: 0, count: 0 };
        }
        acc[categoryName].amount += Math.abs(Number(t.amount));
        acc[categoryName].count += 1;
        return acc;
      },
      {} as Record<string, { amount: number; count: number }>,
    );

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
      categoryStats,
    };
  }

  async getTransactionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: [
        { transactionDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getCategoryExpenses(userId: string, months: number, previousPeriod = false) {
    const endDate = new Date();
    const startDate = new Date();

    if (previousPeriod) {
      // 上一周期：往前多推 months 个月，取该时间段的数据
      startDate.setMonth(startDate.getMonth() - months * 2);
    } else {
      startDate.setMonth(startDate.getMonth() - months);
    }
    startDate.setHours(0, 0, 0, 0);

    const where: any = {
      userId,
      type: 'EXPENSE',
      transactionDate: {
        gte: startDate,
      },
    };

    if (previousPeriod) {
      // 上一周期需要有结束边界
      endDate.setMonth(endDate.getMonth() - months);
      endDate.setHours(23, 59, 59, 999);
      where.transactionDate.lte = endDate;
    }

    const categoryExpenses = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: {
        _sum: { amount: 'desc' },
      },
    });

    const categoryIds = categoryExpenses.map(c => c.categoryId);
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        colorClass: true,
      },
    });

    const result = categoryExpenses.map(expense => {
      const category = categories.find(c => c.id === expense.categoryId);
      return {
        categoryId: expense.categoryId,
        categoryName: category?.name || '未知分类',
        icon: category?.icon || '📊',
        colorClass: category?.colorClass || 'bg-gray-100',
        amount: Number(expense._sum.amount || 0),
        count: expense._count.id,
      };
    });

    return result;
  }

  async getCategoryTransactions(userId: string, categoryId: string, months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        transactionDate: {
          gte: startDate,
        },
      },
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });

    return transactions.map(t => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description || '-',
      transactionDate: t.transactionDate.toISOString().slice(0, 10),
    }));
  }

  async getMonthlyTrends(userId: string, months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const monthlyData = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "transaction_date") as month,
        type,
        SUM(amount) as total
      FROM "transactions" 
      WHERE "user_id" = ${userId}
        AND "transaction_date" >= ${startDate}
      GROUP BY DATE_TRUNC('month', "transaction_date"), type
      ORDER BY month ASC
    ` as any[];

    const monthlyTrends = monthlyData.reduce((acc: any[], record: any) => {
      const monthKey = new Date(record.month).toISOString().slice(0, 7);
      let monthData = acc.find(m => m.month === monthKey);
      
      if (!monthData) {
        monthData = { month: monthKey, income: 0, expense: 0 };
        acc.push(monthData);
      }
      
      if (record.type === 'INCOME') {
        monthData.income = Number(record.total);
      } else if (record.type === 'EXPENSE') {
        monthData.expense = Math.abs(Number(record.total));
      }
      
      return acc;
    }, []);

    return monthlyTrends;
  }

  async getAverageMonthlyExpenses(userId: string, months: number) {
    const monthlyTrends = await this.getMonthlyTrends(userId, months);
    
    if (monthlyTrends.length === 0) {
      return 0;
    }
    
    const totalExpenses = monthlyTrends.reduce((sum, month) => sum + month.expense, 0);
    return totalExpenses / monthlyTrends.length;
  }

  async getTopCategoriesByExpense(userId: string, months: number, limit: number = 5) {
    const categoryExpenses = await this.getCategoryExpenses(userId, months);
    return categoryExpenses.slice(0, limit);
  }

  async getDashboardSummary(
    userId: string,
    monthStart?: string,
    monthEnd?: string,
    categoryId?: string,
  ) {
    // Get all-time summary
    const allTimeWhere: any = { userId };
    if (categoryId) {
      allTimeWhere.categoryId = categoryId;
    }

    // Get current month summary
    const monthWhere: any = { userId };
    if (categoryId) {
      monthWhere.categoryId = categoryId;
    }
    if (monthStart || monthEnd) {
      monthWhere.transactionDate = {};
      if (monthStart) {
        monthWhere.transactionDate.gte = new Date(monthStart);
      }
      if (monthEnd) {
        monthWhere.transactionDate.lte = new Date(monthEnd);
      }
    }

    const [
      allTimeIncome,
      allTimeExpense,
      monthIncome,
      monthExpense,
      monthTransactions,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...allTimeWhere, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...allTimeWhere, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...monthWhere, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...monthWhere, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: monthWhere,
        include: { category: true },
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const allTimeTotalIncome = Number(allTimeIncome._sum.amount || 0);
    const allTimeTotalExpense = Math.abs(
      Number(allTimeExpense._sum.amount || 0),
    );
    const allTimeBalance = allTimeTotalIncome - allTimeTotalExpense;

    const monthTotalIncome = Number(monthIncome._sum.amount || 0);
    const monthTotalExpense = Math.abs(Number(monthExpense._sum.amount || 0));
    const monthBalance = monthTotalIncome - monthTotalExpense;

    const categoryStats = monthTransactions.reduce(
      (acc, t) => {
        const categoryName = t.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = { amount: 0, count: 0 };
        }
        acc[categoryName].amount += Math.abs(Number(t.amount));
        acc[categoryName].count += 1;
        return acc;
      },
      {} as Record<string, { amount: number; count: number }>,
    );

    // Generate trend data based on the requested date range
    const trendData: { date: string; amount: number }[] = [];

    // Determine the date range for trend data
    const trendStartDate = monthStart ? new Date(monthStart) : new Date();
    const trendEndDate = monthEnd ? new Date(monthEnd) : new Date();

    // Set to start/end of day
    trendStartDate.setHours(0, 0, 0, 0);
    trendEndDate.setHours(23, 59, 59, 999);

    // Fetch all expenses in the date range in one query
    const trendWhere: any = {
      userId,
      type: 'EXPENSE',
      transactionDate: {
        gte: trendStartDate,
        lte: trendEndDate,
      },
    };
    if (categoryId) {
      trendWhere.categoryId = categoryId;
    }

    const expensesInRange = await this.prisma.transaction.findMany({
      where: trendWhere,
      select: {
        transactionDate: true,
        amount: true,
      },
    });

    // Group by date and sum amounts
    const expenseByDate = new Map<string, number>();
    for (const expense of expensesInRange) {
      const dateKey = expense.transactionDate.toISOString().split('T')[0];
      const current = expenseByDate.get(dateKey) || 0;
      expenseByDate.set(dateKey, current + Math.abs(Number(expense.amount)));
    }

    // Calculate days between start and end
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.ceil(
      (trendEndDate.getTime() - trendStartDate.getTime()) / msPerDay,
    );

    // Limit to max 90 days to avoid performance issues
    const maxDays = Math.min(daysDiff + 1, 90);

    for (let i = 0; i < maxDays; i++) {
      const date = new Date(trendStartDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const amount = expenseByDate.get(dateKey) || 0;

      // Only include days with expenses > 0
      if (amount > 0) {
        trendData.push({
          date: dateKey,
          amount,
        });
      }
    }

    return {
      allTime: {
        totalIncome: allTimeTotalIncome,
        totalExpense: allTimeTotalExpense,
        balance: allTimeBalance,
      },
      currentMonth: {
        totalIncome: monthTotalIncome,
        totalExpense: monthTotalExpense,
        balance: monthBalance,
        transactionCount: monthTransactions.length,
        categoryStats,
        trendData,
      },
    };
  }
}
