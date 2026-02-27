import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: string): Promise<Category[]> {
    const where = type ? { type } : {};

    return this.prisma.category.findMany({
      where,
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }
}
