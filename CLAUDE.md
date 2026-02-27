# EasyBill AI - 项目指南

AI 驱动的智能记账与财务管理应用，具备自然语言处理能力。

**技术栈**: React 19 + Vite + TypeScript (前端) | NestJS 11 + Prisma + PostgreSQL (后端)
**部署**: Railway (后端) | Vercel (前端)
**状态**: Phase 3 已完成 (59% - 20/34 接口) | Phase 4 下一步 (AI 审核模块)

---

## 架构概览

### 单体仓库结构
```
easybill-ai/
├── components/          # React 组件
├── services/           # 前端 API 客户端
├── types.ts            # 共享 TypeScript 接口
├── backend/
│   ├── src/
│   │   ├── modules/    # 功能模块 (auth, users, categories, transactions)
│   │   └── common/     # 共享工具 (装饰器, 过滤器, 拦截器)
│   └── prisma/         # 数据库 schema 和迁移
```

### 后端架构 (NestJS)

**基于模块的结构** - 每个功能都是独立的：
- `auth/`: JWT 认证，邮箱验证码
- `users/`: 用户资料和偏好设置
- `categories/`: 交易分类（预设 15 个）
- `transactions/`: CRUD、筛选、CSV 导出、统计

**全局配置**：
- 所有接口前缀为 `/api`
- 全局验证管道，`whitelist: true`
- 全局异常过滤器和转换拦截器
- Swagger 文档位于 `/api/docs`

### 前端架构 (React)

- **基于组件**: UI 组件位于 `components/`
- **服务层**: `services/api.ts` - 集中式 API 客户端
- **Context 提供者**:
  - `AuthContext.tsx`: 认证状态和 token 管理
  - `LanguageContext.tsx`: 国际化支持
- **Vite 代理**: 开发环境请求 `/api` → `localhost:3000`

### 数据库 Schema (Prisma)

**核心模型**：
- `User`: 核心账户，支持 OAuth
- `Category`: 预设 15 个（9 个支出，5 个收入，1 个转账）
- `Transaction`: 用户交易记录，关联分类
- `AiPendingItem`: AI 解析的待确认交易（Phase 4）
- `VerificationCode`: 注册/密码重置的邮箱验证码

**模式**：
- 所有 ID 使用 UUID (`@db.Uuid`)
- 金额使用 `Decimal(12, 2)` 保证精度
- 用户关联采用级联删除
- 为查询性能添加索引

---

## 开发命令

### 安装依赖
```bash
npm install                    # 前端
cd backend && npm install      # 后端
```

### 开发服务器
```bash
cd backend && npm run start:dev    # 后端 (端口 3000)
npm run dev                        # 前端 (端口 5173)
```

### 数据库操作
```bash
cd backend

npx prisma generate                           # 生成 Prisma Client (schema 变更后)
npx prisma migrate deploy                     # 运行迁移
npx prisma migrate dev --name <name>          # 创建新迁移
npm run seed                                  # 数据库种子 (15 个分类)
npx prisma studio                             # 打开 Prisma Studio
```

### 测试
```bash
cd backend

npm run test              # 单元测试
npm run test:cov          # 单元测试 + 覆盖率
npm run test:e2e          # E2E 测试
./test-phase3.sh          # 自动化 API 集成测试
```

### 构建与生产
```bash
npm run build                      # 前端构建
cd backend && npm run build        # 后端构建
cd backend && npm run start:prod   # 后端生产启动
```

---

## 核心模式与约定

### API 响应格式
所有 API 响应遵循统一的封装格式：
```typescript
{
  code: number,        // HTTP 状态码
  message: string,     // 成功/错误消息
  data: T | null       // 响应数据
}
```

### 认证流程
- 基于 JWT，包含访问令牌 + 刷新令牌
- 注册/密码重置使用邮箱验证码
- 受保护路由使用 `@UseGuards(JwtAuthGuard)`
- **用户 ID 提取**: `req.user.id` (不是 `req.user.userId`)

### 交易类型
三种类型：`EXPENSE`（支出）、`INCOME`（收入）、`TRANSFER`（转账）
- 支出以正数存储，显示为负数
- 来源字段：`AI_EXTRACTED` 或 `MANUAL`
- **日期字段映射**: API 接受 `date`，存储为 `transactionDate`

### 分页模式
```typescript
{
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

### 分类系统
- 15 个预设系统分类 (`isSystem: true`)
- 按类型筛选分类（EXPENSE/INCOME/TRANSFER）
- 每个分类有图标 emoji 和 colorClass 用于 UI

---

## 环境配置

### 后端 (.env)
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<至少32字符>
JWT_REFRESH_SECRET=<至少32字符>
DEEPSEEK_API_KEY=<api-key>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=development|production
```

### 前端 (.env.local / .env.production)
```bash
VITE_API_URL=https://easybill-ai-production.up.railway.app
```

---

## 部署

### Railway (后端)
- 配置文件：`railway.toml` 和 `backend/railway.toml`
- 构建命令：`npm run build:prod` (包含 Prisma generate)
- 启动命令：`npm run start:prod`
- 推送到 main 分支自动部署

### Vercel (前端)
- 配置文件：`vercel.json`
- 构建命令：`npm run build`
- 输出目录：`dist`
- 环境变量：`VITE_API_URL`

---

## 测试与验证

### 自动化测试脚本
- `backend/test-phase3.sh`: 完整的 API 集成测试套件
- `backend/check-phase3.sh`: 开发完成度验证
- `backend/check-db-data.ts`: 数据库数据验证
- `test-phase3-frontend.sh`: 前端集成测试

### API 文档
Swagger UI: `http://localhost:3000/api/docs`
- 交互式 API 测试
- 请求/响应 schema
- 认证支持（Bearer token）

---

## 重要注意事项

### 处理交易时
- 始终使用 `req.user.id`（不是 `req.user.userId`）获取认证用户 ID
- 日期字段映射：API 接受 `date`，存储为 `transactionDate`
- 金额验证：必须是正数，类型决定符号
- 查询时始终包含分类关联以便显示

### 添加新模块时
1. 在 `backend/src/modules/<name>/` 创建模块目录
2. 包含：module、controller、service、DTOs
3. 在 `app.module.ts` 中注册
4. 为 API 文档添加 Swagger 装饰器
5. 编写单元测试（`.spec.ts` 文件）
6. 在前端 `services/api.ts` 中添加新接口

### 数据库迁移
- 永远不要编辑现有迁移
- 始终为 schema 变更创建新迁移
- 先在开发数据库测试迁移
- 种子数据应该是幂等的

### 代码质量
- 后端使用 Prettier (`.prettierrc`) 和 ESLint
- 格式化：`npm run format`
- 检查：`npm run lint`

### 开发规范
- 在开发过程中生成的 sh 脚本或 md 文件都统一放到 tmp 文件夹下，如果tmp文件夹不存在，请创建
- 定位bug的过程中，先基于 bug 新建一个文件夹，命名为 issue_xxxx，文件夹下只包含一个issue_xxxx_summary.md文件和对应的验证脚本文件，issue_xxxx_summary.md总结bug的定位思路、解决方案和测试结论
- 当本地开发或者调试需要启动服务时，请和我确认

---

## 当前开发状态

**已完成 (Phase 1-3)**: 20/34 API 接口 (59%)
- ✅ 基础设施搭建
- ✅ 认证与用户管理（13 个接口）
- ✅ 分类与交易（8 个接口）

**下一阶段 (Phase 4)**: AI 审核模块
- 使用 DeepSeek API 进行 AI 文本解析
- 待审核项目列表和管理
- 批量确认工作流
- 置信度评分系统

---

## 关键文件

需要理解多个组件的文件：
- `backend/src/main.ts`: 应用启动，全局配置
- `backend/src/app.module.ts`: 模块注册和依赖注入
- `backend/prisma/schema.prisma`: 完整数据库 schema
- `services/api.ts`: 前端 API 客户端，包含所有接口
- `AuthContext.tsx`: 认证状态管理
- `components/Transactions.tsx`: 主要交易管理 UI

---

## 快速开始检查清单

1. 安装依赖（前端 + 后端）
2. 设置 `.env` 文件（后端和前端）
3. 启动 PostgreSQL 数据库
4. 运行迁移：`cd backend && npx prisma migrate deploy`
5. 数据库种子：`cd backend && npm run seed`
6. 启动后端：`cd backend && npm run start:dev`
7. 启动前端：`npm run dev`
8. 访问 Swagger 文档：`http://localhost:3000/api/docs`
9. 访问应用：`http://localhost:5173`
