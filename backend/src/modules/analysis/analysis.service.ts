import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AiItemsService } from '../ai-items/ai-items.service';
import { AnalysisSummaryDto } from './dto/analysis-summary.dto';
import { TrendAnalysisDto } from './dto/trend-analysis.dto';
import { CategoryAnalysisDto } from './dto/category-analysis.dto';
import { PredictionAnalysisDto } from './dto/prediction-analysis.dto';
import { AiRecommendationsDto } from './dto/ai-recommendation.dto';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  private readonly deepseekApiKey: string;
  private readonly deepseekApiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
    private readonly aiItemsService: AiItemsService,
    private readonly configService: ConfigService,
  ) {
    this.deepseekApiKey = this.configService.get<string>('ai.deepseekApiKey') || '';
    this.deepseekApiUrl = this.configService.get<string>('ai.deepseekApiUrl') || 'https://api.deepseek.com/v1';
  }

  async getAnalysisSummary(userId: string, months: number): Promise<AnalysisSummaryDto> {
    this.logger.log(`Getting analysis summary for user ${userId}, ${months} months`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    // 获取时间范围内的交易数据
    const transactions = await this.transactionsService.getTransactionsByDateRange(
      userId,
      startDate,
      endDate,
    );

    // 计算收入支出
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netSavings = income - expense;
    const averageMonthlyExpense = expense / months;
    
    // 预算利用率 (假设月预算为月均支出的120%)
    const monthlyBudget = averageMonthlyExpense * 1.2;
    const currentMonthExpense = transactions
      .filter(t => {
        const transactionDate = new Date(t.transactionDate);
        const now = new Date();
        return (
          t.type === 'EXPENSE' &&
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const budgetUtilization = monthlyBudget > 0 ? (currentMonthExpense / monthlyBudget) * 100 : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings,
      averageMonthlyExpense,
      budgetUtilization: Math.min(budgetUtilization, 100),
      months,
      transactionCount: transactions.length,
    };
  }

  async getTrendAnalysis(userId: string, months: number): Promise<TrendAnalysisDto> {
    this.logger.log(`Getting trend analysis for user ${userId}, ${months} months`);

    // 获取月度趋势数据
    const monthlyTrends = await this.transactionsService.getMonthlyTrends(userId, months);

    // 计算净额
    const monthlyTrendsWithNet = monthlyTrends.map(trend => ({
      month: trend.month,
      income: trend.income,
      expense: trend.expense,
      net: trend.income - trend.expense,
    }));

    // 获取分类趋势数据
    const categoryExpenses = await this.transactionsService.getCategoryExpenses(userId, months);
    const totalExpense = categoryExpenses.reduce((sum, cat) => sum + cat.amount, 0);

    const categoryTrends = categoryExpenses.slice(0, 5).map(category => {
      // 简单的趋势计算（实际应用中可能需要更复杂的算法）
      const trend: 'up' | 'down' | 'stable' = 
        category.amount > totalExpense * 0.2 ? 'up' : 
        category.amount < totalExpense * 0.05 ? 'down' : 'stable';

      return {
        category: category.categoryName,
        amount: category.amount,
        percentage: totalExpense > 0 ? (category.amount / totalExpense) * 100 : 0,
        trend,
        categoryId: category.categoryId,
        icon: category.icon,
        colorClass: category.colorClass,
      };
    });

    return {
      monthly: monthlyTrendsWithNet,
      categories: categoryTrends,
    };
  }

  async getCategoryAnalysis(userId: string, months: number): Promise<CategoryAnalysisDto[]> {
    this.logger.log(`Getting category analysis for user ${userId}, ${months} months`);

    // 获取当前周期的分类支出
    const currentCategoryExpenses = await this.transactionsService.getCategoryExpenses(userId, months);
    
    // 获取上一个周期的分类支出（用于比较）
    const previousCategoryExpenses = await this.transactionsService.getCategoryExpenses(userId, months);
    
    const totalExpense = currentCategoryExpenses.reduce((sum, cat) => sum + cat.amount, 0);

    return currentCategoryExpenses.map(currentCategory => {
      const previousCategory = previousCategoryExpenses.find(
        cat => cat.categoryId === currentCategory.categoryId
      );

      const changeAmount = previousCategory ? 
        currentCategory.amount - previousCategory.amount : 0;
      
      const changePercentage = previousCategory && previousCategory.amount > 0 ? 
        (changeAmount / previousCategory.amount) * 100 : 0;

      const trend: 'up' | 'down' | 'stable' = 
        changePercentage > 10 ? 'up' : 
        changePercentage < -10 ? 'down' : 'stable';

      return {
        categoryId: currentCategory.categoryId,
        categoryName: currentCategory.categoryName,
        icon: currentCategory.icon,
        colorClass: currentCategory.colorClass,
        amount: currentCategory.amount,
        count: currentCategory.count,
        percentage: totalExpense > 0 ? (currentCategory.amount / totalExpense) * 100 : 0,
        trend,
        changeAmount,
        changePercentage,
      };
    });
  }

  async getPredictions(userId: string): Promise<PredictionAnalysisDto> {
    this.logger.log(`Getting predictions for user ${userId}`);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 获取本月当前支出
    const currentMonthTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: now,
        },
      },
    });

    const currentExpense = currentMonthTransactions.reduce(
      (sum, t) => sum + Number(t.amount), 
      0
    );

    // 获取过去3个月的平均支出
    const averageMonthlyExpense = await this.transactionsService.getAverageMonthlyExpenses(userId, 3);

    // 预测本月总支出（基于当前支出趋势）
    const daysPassed = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyAverage = daysPassed > 0 ? currentExpense / daysPassed : 0;
    const monthEndExpense = dailyAverage * daysInMonth;

    // 预算设置（使用月均支出的120%作为预算）
    const monthlyBudget = averageMonthlyExpense * 1.2;
    const remainingBudget = monthlyBudget - currentExpense;
    const budgetUtilization = monthlyBudget > 0 ? (currentExpense / monthlyBudget) * 100 : 0;

    // 风险评估
    const riskLevel: 'low' | 'medium' | 'high' = 
      budgetUtilization > 90 ? 'high' :
      budgetUtilization > 70 ? 'medium' : 'low';

    const predictedOverspend = Math.max(0, monthEndExpense - monthlyBudget);

    // 预测准确度（基于数据量和时间）
    const confidence = Math.min(
      Math.max(
        (daysPassed / daysInMonth) * 
        Math.min(currentMonthTransactions.length / 10, 1) * 100,
        20
      ),
      90
    );

    return {
      monthEndExpense: Math.round(monthEndExpense * 100) / 100,
      currentExpense: Math.round(currentExpense * 100) / 100,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      riskLevel,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      predictedOverspend: Math.round(predictedOverspend * 100) / 100,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      confidence: Math.round(confidence),
    };
  }

  async getAiRecommendations(userId: string, months: number): Promise<AiRecommendationsDto> {
    this.logger.log(`Getting AI recommendations for user ${userId}, ${months} months`);

    try {
      // 收集分析数据
      const [summary, categoryAnalysis, trends] = await Promise.all([
        this.getAnalysisSummary(userId, months),
        this.getCategoryAnalysis(userId, months),
        this.getTrendAnalysis(userId, months),
      ]);

      // 准备给AI的数据
      const analysisData = {
        summary: {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netSavings: summary.netSavings,
          averageMonthlyExpense: summary.averageMonthlyExpense,
          budgetUtilization: summary.budgetUtilization,
        },
        topCategories: categoryAnalysis.slice(0, 5).map(cat => ({
          name: cat.categoryName,
          amount: cat.amount,
          percentage: cat.percentage,
          trend: cat.trend,
          changePercentage: cat.changePercentage,
        })),
        trends: {
          monthly: trends.monthly.slice(-3), // 最近3个月
        },
        months,
      };

      // 调用AI生成建议
      const aiResponse = await this.generateFinancialAdvice(analysisData);

      return {
        summary: aiResponse.summary || '基于您的消费数据分析，我们为您提供以下个性化建议。',
        insights: aiResponse.insights || [],
        recommendations: aiResponse.recommendations || [],
        riskWarnings: aiResponse.riskWarnings || [],
        nextMonthBudget: aiResponse.nextMonthBudget || {},
        overallScore: aiResponse.overallScore || 7,
        months,
      };
    } catch (error) {
      this.logger.error(`Failed to get AI recommendations: ${error}`);
      
      // 返回默认建议
      return this.getDefaultRecommendations(userId, months);
    }
  }

  private async generateFinancialAdvice(analysisData: any): Promise<any> {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const systemPrompt = `你是一个专业的消费理财分析专家，请基于用户消费数据提供深度分析和个性化建议。

## 分析维度：
1. **消费趋势分析**：收入vs支出变化、月度波动
2. **分类支出分析**：主要消费类别、异常增长点、可优化领域  
3. **消费习惯评估**：消费频率、单笔金额、时间模式
4. **预算健康度**：预算执行情况、超支风险预警

## 建议要求：
- 提供3-5条具体可行的省钱建议
- 识别异常消费行为并提醒
- 给出下月预算建议
- 推荐替代消费方案
- 每条建议包含：分类、具体建议、预计节省金额、优先级、可行性评分(1-10)、实施难度

## 输出格式：
返回严格的 JSON 格式，不要包含任何其他文字：
{
  "summary": "总体消费状况一句话总结",
  "insights": ["洞察点1", "洞察点2", ...],
  "recommendations": [
    {
      "category": "类别名称",
      "suggestion": "具体建议",
      "potentialSavings": 预计节省金额,
      "priority": "high/medium/low",
      "feasibilityScore": 可行性评分(1-10),
      "difficulty": "easy/medium/hard"
    }
  ],
  "riskWarnings": ["风险提示1", ...],
  "nextMonthBudget": {"分类名称": 建议预算金额, ...},
  "overallScore": 总体评分(1-10)
}

请确保建议个性化、可操作，避免泛泛而谈。`;

    const userPrompt = `请基于以下用户消费数据提供深度分析：

当前日期：${currentDate}
分析数据：${JSON.stringify(analysisData, null, 2)}

请提供个性化建议，格式要求如上所述。`;

    try {
      // 添加超时控制 - 使用 AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

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
          temperature: 0.3,
          max_tokens: 1000, // 减少 token 数量加快响应
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('DeepSeek API 返回内容为空');
      }

      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从 AI 响应中提取 JSON');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // 如果是超时错误，记录并抛出
      if (error.name === 'AbortError') {
        this.logger.warn('DeepSeek API call timeout after 8 seconds');
        throw new Error('AI 建议生成超时');
      }
      
      this.logger.error(`DeepSeek API call failed: ${error}`);
      throw error;
    }
  }

  private getDefaultRecommendations(userId: string, months: number): AiRecommendationsDto {
    return {
      summary: '基于您的消费数据分析，我们为您提供以下个性化建议。',
      insights: [
        '建议定期查看消费报表，了解消费趋势',
        '合理规划月度预算，避免超支',
        '适当减少非必要开支，增加储蓄比例',
      ],
      recommendations: [
        {
          category: '餐饮美食',
          suggestion: '减少外卖频率，尝试自己做饭，既健康又省钱',
          potentialSavings: 500,
          priority: 'high',
          feasibilityScore: 8,
          difficulty: 'medium',
        },
        {
          category: '订阅服务',
          suggestion: '检查并取消不常用的订阅服务，节省固定开支',
          potentialSavings: 200,
          priority: 'medium',
          feasibilityScore: 9,
          difficulty: 'easy',
        },
      ],
      riskWarnings: [
        '注意控制娱乐消费，避免冲动购物',
      ],
      nextMonthBudget: {
        '餐饮美食': 2000,
        '交通出行': 800,
        '购物消费': 1500,
      },
      overallScore: 7,
      months,
    };
  }
}