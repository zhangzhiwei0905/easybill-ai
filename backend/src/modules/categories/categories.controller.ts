import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '获取分类列表' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
  })
  async findAll(@Query('type') type?: string) {
    return this.categoriesService.findAll(type);
  }
}
