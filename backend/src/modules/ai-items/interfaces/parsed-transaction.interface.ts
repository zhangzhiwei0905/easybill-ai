export interface ParsedTransaction {
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description: string;
  date: string;
  categoryHint?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  parseError?: string;
}

export interface DeepSeekResponse {
  type: string;
  amount: number | null;
  description: string;
  date: string;
  categoryHint?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  parseError?: string;
}

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  餐饮美食: [
    '餐饮',
    '外卖',
    '美团',
    '饿了么',
    '餐厅',
    '咖啡',
    '奶茶',
    '食品',
    '肯德基',
    '麦当劳',
    '星巴克',
    '瑞幸',
    '必胜客',
    '海底捞',
    '点餐',
    '吃饭',
    '午餐',
    '晚餐',
    '早餐',
    '夜宵',
  ],
  购物消费: [
    '购物',
    '淘宝',
    '京东',
    '拼多多',
    '超市',
    '便利店',
    '天猫',
    '商店',
    '百货',
    '优衣库',
    '沃尔玛',
    '盒马',
    '购物',
    '商城',
    '下单',
  ],
  交通出行: [
    '交通',
    '打车',
    '滴滴',
    '加油',
    '停车',
    '地铁',
    '高铁',
    '火车',
    '机票',
    '航班',
    '出行',
    '乘车',
    '出租车',
    '网约车',
    '公交',
    '共享单车',
    '哈啰',
    '高德',
  ],
  生活缴费: [
    '缴费',
    '水电',
    '燃气',
    '物业',
    '话费',
    '宽带',
    '电费',
    '水费',
    '充值',
    '移动',
    '联通',
    '电信',
    '天然气',
  ],
  医疗健康: [
    '医疗',
    '医院',
    '药店',
    '体检',
    '药房',
    '诊所',
    '健康',
    '挂号',
    '门诊',
    '医保',
    '齿科',
    '眼科',
  ],
  娱乐休闲: [
    '娱乐',
    '游戏',
    '电影',
    'KTV',
    '音乐',
    '视频',
    '休闲',
    '爱奇艺',
    '腾讯视频',
    '优酷',
    'Netflix',
    'Steam',
    '剧本杀',
    '密室',
  ],
  学习教育: [
    '教育',
    '培训',
    '课程',
    '学习',
    '书店',
    '学校',
    '网课',
    '知识付费',
    '得到',
    '知乎',
    'VIP',
    '会员',
  ],
  人情往来: ['红包', '礼金', '人情', '礼物', '请客', '生日', '结婚', '份子钱'],
  转账: ['转账', '汇款', '还款', '转出', '转入', '借条', '还钱'],
  工资收入: ['工资', '薪资', '代发', '薪酬', '月薪', '工资发放', '工资到账'],
  投资收益: [
    '理财',
    '收益',
    '分红',
    '利息',
    '基金',
    '股票',
    '股息',
    '红利',
    '盈利',
  ],
  奖金收入: ['奖金', '提成', '绩效', '年终奖', '奖金发放'],
  兼职收入: ['兼职', '副业', '外快', '劳务费', '稿费'],
};

// 系统预设分类列表（与数据库保持一致）
export const SYSTEM_CATEGORIES = [
  // 支出分类
  {
    name: '餐饮美食',
    type: 'EXPENSE',
    icon: 'restaurant',
    keywords: ['餐饮', '外卖', '美团', '饿了么', '咖啡', '奶茶', '餐厅'],
  },
  {
    name: '购物消费',
    type: 'EXPENSE',
    icon: 'shopping_bag',
    keywords: ['购物', '淘宝', '京东', '拼多多', '超市', '便利店'],
  },
  {
    name: '交通出行',
    type: 'EXPENSE',
    icon: 'directions_car',
    keywords: ['打车', '滴滴', '加油', '停车', '地铁', '高铁'],
  },
  {
    name: '生活缴费',
    type: 'EXPENSE',
    icon: 'receipt_long',
    keywords: ['缴费', '水电', '燃气', '物业', '话费'],
  },
  {
    name: '医疗健康',
    type: 'EXPENSE',
    icon: 'medical_services',
    keywords: ['医疗', '医院', '药店', '体检'],
  },
  {
    name: '娱乐休闲',
    type: 'EXPENSE',
    icon: 'sports_esports',
    keywords: ['娱乐', '游戏', '电影', 'KTV'],
  },
  {
    name: '学习教育',
    type: 'EXPENSE',
    icon: 'school',
    keywords: ['教育', '培训', '课程', '学习'],
  },
  {
    name: '人情往来',
    type: 'EXPENSE',
    icon: 'card_giftcard',
    keywords: ['红包', '礼金', '人情', '礼物'],
  },
  {
    name: '转账',
    type: 'EXPENSE',
    icon: 'swap_horiz',
    keywords: ['转账', '汇款', '还款'],
  },
  // 收入分类
  {
    name: '工资收入',
    type: 'INCOME',
    icon: 'account_balance_wallet',
    keywords: ['工资', '薪资', '代发', '薪酬'],
  },
  {
    name: '投资收益',
    type: 'INCOME',
    icon: 'trending_up',
    keywords: ['理财', '收益', '分红', '利息'],
  },
  {
    name: '奖金收入',
    type: 'INCOME',
    icon: 'emoji_events',
    keywords: ['奖金', '提成', '绩效'],
  },
  {
    name: '兼职收入',
    type: 'INCOME',
    icon: 'work',
    keywords: ['兼职', '副业', '外快'],
  },
];
