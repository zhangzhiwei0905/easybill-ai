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
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Amount filter (compare absolute values)
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.OR = [];
      // For EXPENSE (negative amounts stored as positive)
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
      // For INCOME (positive amounts)
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
      where.OR.push(expenseConditions, incomeConditions);
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Map sortBy to actual database field
    const orderByField =
      sortBy === 'date'
        ? 'transactionDate'
        : sortBy === 'amount'
          ? 'amount'
          : 'createdAt';

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: {
          [orderByField]: sortOrder,
        },
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
        orderBy: { transactionDate: 'desc' },
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
      orderBy: {
        transactionDate: 'desc',
      },
    });
  }

  async getCategoryExpenses(userId: string, months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const categoryExpenses = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: startDate,
        },
      },
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
  ) {
    // Get all-time summary
    const allTimeWhere: any = { userId };

    // Get current month summary
    const monthWhere: any = { userId };
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
        orderBy: { transactionDate: 'desc' },
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
    const expensesInRange = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: trendStartDate,
          lte: trendEndDate,
        },
      },
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
