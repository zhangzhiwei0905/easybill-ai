# EasyBill AI - 产品需求文档 (PRD)

**项目名称**: EasyBill AI
**版本**: v1.0
**最后更新**: 2026-02-25
**文档状态**: 正式版

---

## 1. 项目概述

### 1.1 产品定位
EasyBill AI 是一款 AI 驱动的智能记账与财务管理应用，通过人工智能技术自动识别和分类消费记录，帮助用户轻松管理个人财务，提供智能分析和消费洞察。

### 1.2 核心价值
- **智能识别**: AI 自动解析短信、文本中的消费信息
- **便捷记账**: 一键确认 AI 识别结果，减少手动输入
- **数据洞察**: 智能分析消费趋势，提供省钱建议
- **多端同步**: 数据云端存储，多设备访问

### 1.3 目标用户
- 需要记账但嫌麻烦的年轻人
- 希望了解消费习惯的职场人士
- 追求财务自由的理财爱好者

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **前端** | React 18 + TypeScript + Vite | 现代化前端框架 |
| **UI 库** | Tailwind CSS + Lucide Icons | 原子化 CSS + 图标库 |
| **状态管理** | React Context API | 轻量级状态管理 |
| **路由** | React Router v6 | 单页应用路由 |
| **HTTP 客户端** | Axios | API 请求封装 |
| **后端框架** | NestJS | 企业级 TypeScript 后端框架 |
| **数据库** | PostgreSQL 16 (Supabase) | 关系型数据库 |
| **ORM** | Prisma | 类型安全的 ORM |
| **缓存** | Redis | 验证码缓存、限流 |
| **认证** | JWT + Passport | 无状态认证 |
| **AI 引擎** | DeepSeek / Gemini API | 文本解析与分析 |
| **部署** | Vercel (前端) + Railway (后端) | Serverless 部署 |

### 2.2 系统架构图

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────┐
│   Vercel (Frontend)             │
│   - React SPA                   │
│   - Static Assets               │
└──────┬──────────────────────────┘
       │ REST API
       ▼
┌─────────────────────────────────┐
│   Railway (Backend)             │
│   - NestJS API Server           │
│   - JWT Authentication          │
└──────┬──────────────────────────┘
       │
       ├─────────────┬─────────────┬──────────────┐
       ▼             ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Supabase  │  │  Redis   │  │ DeepSeek │  │  Email   │
│PostgreSQL│  │  Cache   │  │ AI API   │  │  SMTP    │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## 3. 功能模块设计

### 3.1 认证模块 (Auth)

#### 功能列表
- 邮箱注册（含验证码）
- 邮箱登录
- 忘记密码（含验证码）
- 第三方登录（Google、微信）
- 退出登录
- Token 刷新

#### API 接口
| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 注册 | POST | /api/auth/register | 邮箱+密码+验证码注册 |
| 登录 | POST | /api/auth/login | 邮箱+密码登录 |
| 发送验证码 | POST | /api/auth/send-code | 发送邮箱验证码 |
| 重置密码 | POST | /api/auth/reset-password | 验证码+新密码重置 |
| 刷新Token | POST | /api/auth/refresh | 使用 refreshToken 获取新 token |
| 获取当前用户 | GET | /api/auth/me | 获取登录用户信息 |
| 退出登录 | POST | /api/auth/logout | 退出登录 |
| Google登录 | POST | /api/auth/google | Google OAuth 登录 |

#### 业务规则
- 验证码有效期: 10 分钟
- 验证码发送频率限制: 60 秒/次
- 密码最小长度: 6 位
- JWT Token 有效期: 7 天
- Refresh Token 有效期: 30 天

---

### 3.2 用户模块 (Users)

#### 功能列表
- 获取用户资料
- 更新用户资料（昵称、头像）
- 获取用户偏好设置
- 更新用户偏好设置（币种、语言、主题）
- 修改密码

#### API 接口
| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取资料 | GET | /api/users/profile | 获取用户基本信息 |
| 更新资料 | PUT | /api/users/profile | 更新昵称、头像 |
| 获取偏好 | GET | /api/users/preferences | 获取用户偏好设置 |
| 更新偏好 | PUT | /api/users/preferences | 更新币种、语言、主题 |
| 修改密码 | PATCH | /api/users/password | 修改登录密码 |

---

### 3.3 交易模块 (Transactions)

#### 功能列表
- 交易列表查询（分页、筛选、搜索）
- 手动新增交易
- 编辑交易
- 删除交易
- 导出 CSV
- 交易统计摘要

#### API 接口
| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 交易列表 | GET | /api/transactions | 分页+筛选+搜索 |
| 新增交易 | POST | /api/transactions | 手动记账 |
| 更新交易 | PUT | /api/transactions/:id | 编辑交易信息 |
| 删除交易 | DELETE | /api/transactions/:id | 删除交易记录 |
| 导出CSV | GET | /api/transactions/export | 导出筛选后的数据 |
| 统计摘要 | GET | /api/transactions/stats | 收支统计 |

#### 筛选参数
- `type`: 交易类型（INCOME/EXPENSE/TRANSFER）
- `source`: 来源（MANUAL/AI_EXTRACTED/IMPORTED）
- `categoryId`: 分类 ID
- `startDate`: 开始日期
- `endDate`: 结束日期
- `minAmount`: 最小金额
- `maxAmount`: 最大金额
- `search`: 关键词搜索（描述、分类）
- `page`: 页码
- `pageSize`: 每页条数

---

### 3.4 AI 审核模块 (AI Items)

#### 功能列表
- 获取 AI 待审核列表
- 提交文本进行 AI 解析
- 刷新/拉取新的 AI 识别记录
- 编辑 AI 识别结果
- 确认单条记录入账
- 批量确认全部入账

#### API 接口
| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 待审核列表 | GET | /api/ai-items | 获取 PENDING 状态记录 |
| AI 解析 | POST | /api/ai-items/parse | 提交文本进行解析 |
| 刷新记录 | POST | /api/ai-items/refresh | 拉取新的识别记录 |
| 编辑记录 | PUT | /api/ai-items/:id | 修改金额、分类等 |
| 确认入账 | POST | /api/ai-items/:id/confirm | 单条确认 |
| 全部确认 | POST | /api/ai-items/confirm-all | 批量确认 |

#### AI 解析字段
- `rawText`: 原始文本
- `type`: 交易类型（INCOME/EXPENSE）
- `amount`: 金额
- `description`: 描述
- `parsedDate`: 交易日期
- `confidence`: 置信度（HIGH/MEDIUM/LOW）
- `categoryId`: 推荐分类

---

### 3.5 仪表盘模块 (Dashboard)

#### 功能列表
- 财务概览统计
- 支出趋势图表
- 分类分布饼图

#### API 接口
| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 财务概览 | GET | /api/dashboard/summary | 本月收支、余额等 |
| 支出趋势 | GET | /api/dashboard/trend | 按日/周/月聚合 |
| 分类分布 | GET | /api/dashboard/category-distribution | 各分类占比 |

---

### 3.6 AI 分析模块 (Analysis)

#### 功能列表
- AI 智能洞察
- 收支趋势分析
- 支出分类 TOP N
- 月底支出预测
- 省钱建议

#### API 接口
| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 智能洞察 | GET | /api/analysis/insight | AI 生成消费分析文本 |
| 趋势分析 | GET | /api/analysis/trend | 6个月收支趋势 |
| TOP分类 | GET | /api/analysis/top-categories | 支出最多的分类 |
| 支出预测 | GET | /api/analysis/prediction | 预测月底总支出 |
| 省钱建议 | GET | /api/analysis/suggestions | AI 生成省钱建议 |

---

### 3.7 分类模块 (Categories)

#### 功能列表
- 获取分类列表

#### API 接口
| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 分类列表 | GET | /api/categories | 获取所有分类 |

#### 预设分类
**支出类别**:
- 餐饮美食 🍜
- 购物消费 🛍️
- 交通出行 🚗
- 生活缴费 💡
- 医疗健康 🏥
- 娱乐休闲 🎮
- 学习教育 📚
- 人情往来 🎁
- 其他支出 📦

**收入类别**:
- 工资收入 💰
- 兼职收入 💼
- 投资收益 📈
- 红包礼金 🧧
- 其他收入 💵

---

## 4. 数据库设计

### 4.1 数据表清单

| 表名 | 说明 | 记录数预估 |
|------|------|-----------|
| users | 用户账户 | 10K+ |
| oauth_accounts | 第三方登录 | 5K+ |
| verification_codes | 验证码 | 临时数据 |
| user_preferences | 用户偏好 | 10K+ |
| categories | 交易分类 | ~20 条 |
| transactions | 交易记录 | 100K+ |
| ai_pending_items | AI 待审核 | 1K+ |

### 4.2 核心表结构

#### users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  is_pro BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### transactions 表
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  sub_description VARCHAR(255),
  transaction_date DATE NOT NULL,
  source VARCHAR(20) DEFAULT 'MANUAL',
  ai_item_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
```

#### ai_pending_items 表
```sql
CREATE TABLE ai_pending_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  raw_text TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  parsed_date DATE NOT NULL,
  confidence VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_items_user_status ON ai_pending_items(user_id, status);
```

---

## 5. 非功能性需求

### 5.1 性能要求
- API 响应时间: < 200ms (P95)
- 页面加载时间: < 2s
- 并发用户数: 1000+
- 数据库查询优化: 使用索引，避免 N+1 查询

### 5.2 安全要求
- 密码加密: bcrypt (cost=12)
- JWT Token 签名: HS256
- HTTPS 强制加密
- SQL 注入防护: 使用 Prisma ORM
- XSS 防护: 前端输入验证
- CSRF 防护: SameSite Cookie
- 限流保护: 60 req/min per IP

### 5.3 可用性要求
- 系统可用性: 99.9%
- 数据备份: 每日自动备份
- 错误监控: Sentry 集成
- 日志记录: Winston/Pino

### 5.4 兼容性要求
- 浏览器: Chrome 90+, Safari 14+, Firefox 88+
- 移动端: 响应式设计，支持 iOS/Android
- 屏幕尺寸: 320px ~ 2560px

---

## 6. 开发阶段规划

### Phase 1: 基础设施搭建 ✅
- NestJS 项目初始化
- Prisma + PostgreSQL 配置
- Redis 配置
- 全局异常处理
- Swagger 文档

### Phase 2: 认证与用户模块 ✅
- 用户注册/登录/登出
- 邮箱验证码
- 密码重置
- JWT 认证
- 用户资料管理
- 偏好设置

### Phase 3: 分类与交易模块 🔜
- 分类数据初始化
- 交易 CRUD
- 交易筛选与分页
- CSV 导出
- 统计摘要

### Phase 4: AI 审核模块 🔜
- AI API 集成
- 文本解析
- 待审核记录管理
- 确认入账

### Phase 5: 仪表盘与分析模块 🔜
- 仪表盘统计
- 趋势分析
- AI 洞察生成
- 支出预测

### Phase 6: 测试与优化 🔜
- 单元测试
- 集成测试
- E2E 测试
- 性能优化
- 安全审计

---

## 7. API 接口总览

### 接口统计
- **认证模块**: 8 个接口
- **用户模块**: 5 个接口
- **交易模块**: 6 个接口
- **AI 审核模块**: 6 个接口
- **仪表盘模块**: 3 个接口
- **分析模块**: 5 个接口
- **分类模块**: 1 个接口
- **总计**: 34 个接口

### 认证方式
- 公开接口: 注册、登录、发送验证码、重置密码、第三方登录
- 需要认证: 其他所有接口（Bearer Token）

---

## 8. 附录

### 8.1 状态码规范
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 409: 资源冲突
- 429: 请求过于频繁
- 500: 服务器错误

### 8.2 错误码规范
- AUTH_001: 邮箱已注册
- AUTH_002: 验证码无效
- AUTH_003: 验证码已过期
- AUTH_004: 邮箱或密码错误
- AUTH_005: Token 无效或已过期
- TRANS_001: 交易不存在
- TRANS_002: 无权限操作
- AI_001: AI 解析失败

---

**文档维护**: 开发团队
**审核人**: 产品经理
**最后更新**: 2026-02-25
