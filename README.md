# EasyBill AI

AI 驱动的智能记账应用，支持自然语言短信解析、自动分类、消费趋势分析。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + Vite + TypeScript + Tailwind CSS |
| 后端 | NestJS + Prisma 7 + TypeScript |
| 数据库 | PostgreSQL |
| 缓存 | Redis |
| AI | DeepSeek API（短信解析 + 财务建议） |
| 认证 | JWT（Access Token + Refresh Token） |
| 部署 | Docker Compose 一键部署 |

## 本地开发

### 前置条件

- Node.js 20+
- PostgreSQL 数据库
- Redis（可选，本地开发可不启用）

### 后端

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量（从项目根目录）
cp ../.env.example ../.env
# 编辑 .env，填入数据库连接等信息

# 初始化数据库
npx prisma generate
npx prisma migrate deploy
npm run seed

# 启动（端口 3000）
npm run start:dev
```

### 前端

```bash
# 项目根目录
npm install
npm run dev
```

访问 `http://localhost:5173`，Vite 自动将 `/api` 代理到后端 `localhost:3000`。

## Docker Compose 部署

将项目克隆到服务器，配置 `.env` 后一键启动全部服务：

```bash
# 1. 克隆项目
git clone git@github.com:zhangzhiwei0905/easybill-ai.git
cd easybill-ai

# 2. 配置环境变量
cp .env.example .env
vim .env  # 填入 DATABASE_URL、JWT_SECRET、DEEPSEEK_API_KEY 等

# 3. 一键启动（PostgreSQL + Redis + 后端 + 前端 + 数据库迁移）
docker compose up -d
```

服务启动后：
- **前端**: `http://<服务器IP>:8081`
- **后端 API**: `http://<服务器IP>:8081/api`
- **Swagger 文档**: `http://<服务器IP>:8081/api/docs`

### 更新部署

```bash
git pull
docker compose up -d --build
```

## 环境变量

根目录 `.env` 文件（参考 `.env.example`）：

```bash
# 必填
DATABASE_URL=postgresql://user:password@host:5432/easybill
POSTGRES_PASSWORD=your-password      # Docker 部署时需要
JWT_SECRET=<至少 32 字符>
JWT_REFRESH_SECRET=<至少 32 字符>
DEEPSEEK_API_KEY=sk-xxx              # DeepSeek API Key

# 可选
DEEPSEEK_API_URL=https://api.deepseek.com/v1
SMTP_HOST=smtp.gmail.com             # 邮箱验证码
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OSS_REGION=oss-cn-shenzhen           # 阿里云 OSS 头像存储
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_BUCKET=easybill-avatars
```

## 项目结构

```
easybill-ai/
├── components/            # React 组件
│   ├── analysis/          # 收支分析子组件
│   ├── Dashboard.tsx      # 仪表盘
│   ├── Transactions.tsx   # 账单明细
│   ├── AiAudit.tsx        # AI 审核
│   ├── AiAnalysis.tsx     # 收支分析
│   ├── Settings.tsx       # 系统设置
│   └── Auth.tsx           # 登录/注册
├── services/api.ts        # 前端 API 客户端
├── backend/
│   ├── src/modules/
│   │   ├── auth/          # 认证模块
│   │   ├── users/         # 用户模块
│   │   ├── categories/    # 分类模块
│   │   ├── transactions/  # 交易模块
│   │   ├── ai-items/      # AI 审核模块
│   │   └── analysis/      # AI 分析模块
│   └── prisma/
│       └── schema.prisma  # 数据库 Schema
├── docker-compose.yml     # Docker 编排
├── Dockerfile.frontend    # 前端镜像
├── Dockerfile.backend     # 后端镜像
└── .env.example           # 环境变量模板
```

## API 文档

启动后端后访问 Swagger UI：`http://localhost:3000/api/docs`

### 主要接口

| 模块 | 接口数 | 说明 |
|------|--------|------|
| Auth | 7 | 注册、登录、刷新 Token、重置密码、退出 |
| Users | 4 | 个人资料、偏好设置、修改密码、头像上传 |
| Categories | 2 | 分类列表查询 |
| Transactions | 5 | CRUD、CSV 导出、仪表盘统计 |
| AI Items | 8 | AI 解析记录、审核、确认、批量确认 |
| Analysis | 2 | AI 消费分析、趋势预测 |
