import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ParseSmsDto,
  UpdateAiItemDto,
  ConfirmAiItemDto,
  FilterAiItemDto,
} from './dto';
import {
  ParsedTransaction,
  DeepSeekResponse,
  CATEGORY_KEYWORDS,
} from './interfaces/parsed-transaction.interface';
import { AiPendingItem } from '@prisma/client';

@Injectable()
export class AiItemsService {
  private readonly logger = new Logger(AiItemsService.name);
  private readonly deepseekApiKey: string;
  private readonly deepseekApiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.deepseekApiKey =
      this.configService.get<string>('ai.deepseekApiKey') || '';
    this.deepseekApiUrl =
      this.configService.get<string>('ai.deepseekApiUrl') ||
      'https://api.deepseek.com/v1';
  }

  /**
   * 验证用户的 Webhook Key
   */
  async validateWebhookKey(
    userId: string,
    webhookKey: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { webhookKey: true },
    });

    if (!user || !user.webhookKey) {
      this.logger.warn(`User not found or webhook key not set: ${userId}`);
      return false;
    }

    return user.webhookKey === webhookKey;
  }

  /**
   * 调用 DeepSeek API 解析短信
   */
  private async callDeepSeekApi(rawText: string): Promise<DeepSeekResponse> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const systemPrompt = `你是一个专业的银行短信解析助手。请从短信中提取交易信息，返回 JSON 格式。

## 输出格式
返回严格的 JSON 格式，不要包含任何其他文字：
{
  "type": "EXPENSE" | "INCOME",
  "amount": 数字或null,
  "description": "商户名称或交易描述",
  "date": "YYYY-MM-DD格式日期",
  "categoryHint": "分类名称",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "parseError": "错误原因（仅在无法解析时填写）"
}

## 交易类型判断规则
1. EXPENSE（支出）：消费、付款、支付、扣款、购买、支出、转账、汇款、还款
2. INCOME（收入）：收入、入账、到账、收款、工资、奖金、退款

## 金额提取规则
1. 提取纯数字，不带货币符号
2. 如果有多种金额（如手续费），取主要交易金额
3. 如果无法确定金额，设为 null，confidence 设为 LOW

## 日期处理规则
1. 如果有完整日期，直接使用
2. 如果只有月日（如"02月27日"），补充当前年份 ${currentYear}
3. 如果没有日期，使用今天日期 ${currentDate.toISOString().split('T')[0]}

## 分类匹配（categoryHint）
根据交易描述匹配最合适的分类：
- 餐饮美食：外卖、美团、饿了么、餐厅、咖啡、奶茶、肯德基、麦当劳等
- 购物消费：淘宝、京东、拼多多、超市、便利店、商城等
- 交通出行：滴滴、打车、加油、停车、地铁、高铁、机票等
- 生活缴费：水电费、燃气费、物业费、话费、宽带等
- 医疗健康：医院、药店、体检、门诊等
- 娱乐休闲：游戏、电影、KTV、视频会员等
- 学习教育：培训、课程、书店、网课等
- 人情往来：红包、礼金、礼物、请客等
- 转账：转账、汇款、还款等（注意：转账属于支出类型）
- 工资收入：工资、薪资、薪酬等
- 投资收益：理财、收益、分红、利息等
- 奖金收入：奖金、提成、绩效等
- 兼职收入：兼职、副业、外快等

## 置信度评估规则
- HIGH：金额明确、分类清晰、日期完整
- MEDIUM：信息基本完整，但有部分不确定
- LOW：信息不完整、无法确定金额或分类、短信格式异常

## 无法解析的情况
如果短信不是银行交易短信或无法解析：
- type 设为 "EXPENSE"（默认）
- amount 设为 null
- confidence 设为 "LOW"
- parseError 填写具体原因`;

    const userPrompt = `请解析以下短信内容，提取交易信息：

"${rawText}"

请只返回 JSON，不要其他文字。`;

    try {
      const response = await fetch(`${this.deepseekApiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `DeepSeek API error: ${response.status} - ${errorText}`,
        );
        throw new Error(`DeepSeek API 调用失败: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('DeepSeek API 返回内容为空');
      }

      this.logger.debug(`DeepSeek response: ${content}`);

      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从 AI 响应中提取 JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]) as DeepSeekResponse;

      // 验证和清理响应 - 只允许 EXPENSE 和 INCOME
      if (!parsed.type || !['EXPENSE', 'INCOME'].includes(parsed.type)) {
        // 如果 AI 返回 TRANSFER，转为 EXPENSE
        if (parsed.type === 'TRANSFER') {
          parsed.type = 'EXPENSE';
        } else {
          parsed.type = 'EXPENSE';
          parsed.confidence = 'LOW';
          parsed.parseError = '无法确定交易类型';
        }
      }

      if (!parsed.amount || isNaN(parsed.amount) || parsed.amount <= 0) {
        parsed.amount = 0;
        parsed.confidence = 'LOW';
        if (!parsed.parseError) {
          parsed.parseError = '无法提取有效金额';
        }
      }

      if (!parsed.date) {
        parsed.date = new Date().toISOString().split('T')[0];
      }

      return parsed;
    } catch (error) {
      this.logger.error(`DeepSeek API call failed: ${error}`);
      throw error;
    }
  }

  /**
   * 根据分类提示匹配分类
   */
  private async matchCategory(
    hint: string | undefined,
    type: string,
  ): Promise<string | null> {
    if (!hint) return null;

    // 遍历关键词映射，找到匹配的分类
    for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => hint.includes(keyword))) {
        // 在数据库中查找对应分类
        const category = await this.prisma.category.findFirst({
          where: {
            name: categoryName,
            type: type,
          },
        });
        if (category) {
          return category.id;
        }
      }
    }

    // 如果没有精确匹配，尝试模糊匹配
    const allCategories = await this.prisma.category.findMany({
      where: { type },
    });

    for (const category of allCategories) {
      if (CATEGORY_KEYWORDS[category.name]) {
        const keywords = CATEGORY_KEYWORDS[category.name];
        if (keywords.some((keyword) => hint.includes(keyword))) {
          return category.id;
        }
      }
    }

    return null;
  }

  /**
   * 确定置信度（结合 AI 返回值和本地匹配结果）
   */
  private determineConfidence(
    parsed: DeepSeekResponse,
    categoryId: string | null,
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    // 如果 AI 已经给出了置信度，以 AI 为基础
    if (parsed.confidence === 'LOW') {
      return 'LOW';
    }

    let score = 0;

    // 有分类提示加分
    if (parsed.categoryHint) score += 30;
    // 成功匹配分类加分
    if (categoryId) score += 40;
    // 金额有效加分
    if (parsed.amount && parsed.amount > 0) score += 20;
    // 描述非空加分
    if (parsed.description && parsed.description.length > 0) score += 10;

    // 如果 AI 认为是 HIGH，但我们匹配失败，降级为 MEDIUM
    if (parsed.confidence === 'HIGH' && categoryId) {
      return 'HIGH';
    } else if (parsed.confidence === 'HIGH' && !categoryId) {
      return 'MEDIUM';
    }

    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 获取 AI 统计数据
   */
  async getStatistics(userId: string) {
    const [pending, confirmed, rejected, needsManual] = await Promise.all([
      this.prisma.aiPendingItem.count({
        where: { userId, status: 'PENDING' },
      }),
      this.prisma.aiPendingItem.count({
        where: { userId, status: 'CONFIRMED' },
      }),
      this.prisma.aiPendingItem.count({
        where: { userId, status: 'REJECTED' },
      }),
      this.prisma.aiPendingItem.count({
        where: { userId, status: 'NEEDS_MANUAL' },
      }),
    ]);

    const total = pending + confirmed + rejected + needsManual;

    // 获取最近7天的统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentItems = await this.prisma.aiPendingItem.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        category: true,
      },
    });

    // 按日期分组统计
    const dailyStats = recentItems.reduce(
      (acc, item) => {
        const date = item.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, amount: 0 };
        }
        acc[date].count += 1;
        acc[date].amount += Number(item.amount);
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    // 按分类统计
    const categoryStats = recentItems.reduce(
      (acc, item) => {
        const categoryName = item.category?.name || '未分类';
        if (!acc[categoryName]) {
          acc[categoryName] = { count: 0, amount: 0 };
        }
        acc[categoryName].count += 1;
        acc[categoryName].amount += Number(item.amount);
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return {
      total,
      pending,
      confirmed,
      rejected,
      needsManual,
      dailyStats,
      categoryStats,
    };
  }

  /**
   * 解析短信并创建待审核项
   */
  async parseAndCreate(dto: ParseSmsDto): Promise<AiPendingItem> {
    // 验证用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 调用 DeepSeek API
    const parsed = await this.callDeepSeekApi(dto.rawText);

    // 匹配分类
    const categoryId = await this.matchCategory(
      parsed.categoryHint,
      parsed.type,
    );

    // 确定置信度
    const confidence = this.determineConfidence(parsed, categoryId);

    // 根据置信度设置状态
    const status = confidence === 'LOW' ? 'NEEDS_MANUAL' : 'PENDING';

    // 确保 amount 有效（不能为 null）
    const amount = parsed.amount && parsed.amount > 0 ? parsed.amount : 0;

    // 创建待审核项
    const aiItem = await this.prisma.aiPendingItem.create({
      data: {
        userId: dto.userId,
        rawText: dto.rawText,
        type: parsed.type,
        amount,
        description: parsed.description || '待确认',
        parsedDate: new Date(parsed.date),
        categoryId,
        confidence,
        status,
      },
      include: {
        category: true,
      },
    });

    this.logger.log(
      `Created AI pending item: ${aiItem.id}, confidence: ${confidence}`,
    );

    // 返回结果，将 categoryId 放在 category 对象中，避免重复
    const { categoryId: _, ...rest } = aiItem;
    return {
      ...rest,
      category: aiItem.category
        ? {
            ...aiItem.category,
            id: aiItem.categoryId,
          }
        : null,
    } as any;
  }

  /**
   * 获取待审核列表
   */
  async findAll(userId: string, filterDto: FilterAiItemDto) {
    const { status, page = 1, pageSize = 20 } = filterDto;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.aiPendingItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
        },
      }),
      this.prisma.aiPendingItem.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取单个待审核项
   */
  async findOne(userId: string, id: string): Promise<AiPendingItem> {
    const item = await this.prisma.aiPendingItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundException('待审核项不存在');
    }

    if (item.userId !== userId) {
      throw new ForbiddenException('无权访问此待审核项');
    }

    return item;
  }

  /**
   * 更新待审核项
   */
  async update(
    userId: string,
    id: string,
    updateDto: UpdateAiItemDto,
  ): Promise<AiPendingItem> {
    await this.findOne(userId, id);

    const updateData: any = {};
    if (updateDto.type) updateData.type = updateDto.type;
    if (updateDto.amount) updateData.amount = updateDto.amount;
    if (updateDto.description) updateData.description = updateDto.description;
    if (updateDto.date) updateData.parsedDate = new Date(updateDto.date);
    if (updateDto.categoryId) updateData.categoryId = updateDto.categoryId;

    return this.prisma.aiPendingItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  /**
   * 确认入账
   */
  async confirm(
    userId: string,
    id: string,
    confirmDto: ConfirmAiItemDto,
  ): Promise<{ transaction: any; aiItem: AiPendingItem }> {
    const aiItem = await this.findOne(userId, id);

    if (aiItem.status === 'CONFIRMED') {
      throw new Error('该待审核项已确认入账');
    }

    // 使用事务
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建交易记录
      const transaction = await tx.transaction.create({
        data: {
          userId,
          categoryId: confirmDto.categoryId,
          type: confirmDto.type,
          amount: confirmDto.amount,
          description: confirmDto.description,
          transactionDate: new Date(confirmDto.date),
          source: 'AI_EXTRACTED',
          aiItemId: id,
        },
        include: {
          category: true,
        },
      });

      // 更新待审核项状态
      const updatedAiItem = await tx.aiPendingItem.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: {
          category: true,
        },
      });

      return { transaction, aiItem: updatedAiItem };
    });

    this.logger.log(
      `Confirmed AI item ${id}, created transaction ${result.transaction.id}`,
    );

    return result;
  }

  /**
   * 删除待审核项
   */
  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    await this.prisma.aiPendingItem.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    this.logger.log(`Rejected AI item ${id}`);
  }

  /**
   * 永久删除待审核项
   */
  async hardDelete(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    await this.prisma.aiPendingItem.delete({
      where: { id },
    });

    this.logger.log(`Hard deleted AI item ${id}`);
  }
}
