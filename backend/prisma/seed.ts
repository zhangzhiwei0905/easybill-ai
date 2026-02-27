import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { URL } from 'url';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse connection string to extract components
const dbUrl = new URL(connectionString);

const pool = new pg.Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 5432,
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  password: dbUrl.password,
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 开始初始化分类数据...');

  // 支出类别 - 使用正确的 Material Symbols 图标名称（snake_case）
  const expenseCategories = [
    {
      name: '餐饮美食',
      icon: 'restaurant',
      colorClass: 'text-orange-500',
      type: 'EXPENSE',
      sortOrder: 1,
    },
    {
      name: '购物消费',
      icon: 'shopping_bag',
      colorClass: 'text-pink-500',
      type: 'EXPENSE',
      sortOrder: 2,
    },
    {
      name: '交通出行',
      icon: 'directions_car',
      colorClass: 'text-blue-500',
      type: 'EXPENSE',
      sortOrder: 3,
    },
    {
      name: '生活缴费',
      icon: 'lightbulb',
      colorClass: 'text-yellow-500',
      type: 'EXPENSE',
      sortOrder: 4,
    },
    {
      name: '医疗健康',
      icon: 'favorite',
      colorClass: 'text-red-500',
      type: 'EXPENSE',
      sortOrder: 5,
    },
    {
      name: '娱乐休闲',
      icon: 'sports_esports',
      colorClass: 'text-purple-500',
      type: 'EXPENSE',
      sortOrder: 6,
    },
    {
      name: '学习教育',
      icon: 'school',
      colorClass: 'text-indigo-500',
      type: 'EXPENSE',
      sortOrder: 7,
    },
    {
      name: '人情往来',
      icon: 'card_giftcard',
      colorClass: 'text-rose-500',
      type: 'EXPENSE',
      sortOrder: 8,
    },
    {
      name: '转账',
      icon: 'swap_horiz',
      colorClass: 'text-cyan-500',
      type: 'EXPENSE',
      sortOrder: 9,
    },
    {
      name: '其他支出',
      icon: 'inventory_2',
      colorClass: 'text-gray-500',
      type: 'EXPENSE',
      sortOrder: 10,
    },
  ];

  // 收入类别 - 使用正确的 Material Symbols 图标名称（snake_case）
  const incomeCategories = [
    {
      name: '工资收入',
      icon: 'account_balance_wallet',
      colorClass: 'text-green-500',
      type: 'INCOME',
      sortOrder: 1,
    },
    {
      name: '兼职收入',
      icon: 'work',
      colorClass: 'text-teal-500',
      type: 'INCOME',
      sortOrder: 2,
    },
    {
      name: '投资收益',
      icon: 'trending_up',
      colorClass: 'text-emerald-500',
      type: 'INCOME',
      sortOrder: 3,
    },
    {
      name: '红包礼金',
      icon: 'card_giftcard',
      colorClass: 'text-red-500',
      type: 'INCOME',
      sortOrder: 4,
    },
    {
      name: '其他收入',
      icon: 'attach_money',
      colorClass: 'text-lime-500',
      type: 'INCOME',
      sortOrder: 5,
    },
  ];

  const allCategories = [...expenseCategories, ...incomeCategories];

  // 删除旧的 TRANSFER 类型分类
  await prisma.category.deleteMany({
    where: { type: 'TRANSFER' },
  });
  console.log('   - 已删除 TRANSFER 类型分类');

  // 使用 upsert 避免重复插入
  for (const category of allCategories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {
        icon: category.icon,
        colorClass: category.colorClass,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
  }

  console.log(`✅ 成功初始化 ${allCategories.length} 个分类`);
  console.log(`   - 支出类别: ${expenseCategories.length} 个`);
  console.log(`   - 收入类别: ${incomeCategories.length} 个`);
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
