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
    } = filterDto;

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
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

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
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

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
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
      },
    };
  }
}
