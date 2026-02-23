# EasyBill AI 🧾

> 智能记账助手 — AI-powered personal finance tracker

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | NestJS + Prisma 7 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (Access + Refresh Token) |
| AI | DeepSeek API _(coming Phase 4)_ |
| Deploy | Vercel |

## Project Structure

```
easybill-ai/
├── components/          # React components (frontend)
├── services/            # API service layer
├── AuthContext.tsx      # JWT auth state management
├── vite.config.ts       # Vite config (proxy → backend)
└── backend/
    ├── src/
    │   ├── modules/
    │   │   ├── auth/    # Auth module (register/login/etc.)
    │   │   └── users/   # Users module (profile/preferences)
    │   ├── prisma/      # Prisma service
    │   └── common/      # Filters, interceptors, decorators
    ├── prisma/
    │   └── schema.prisma
    └── .env             # ⚠️ Never commit (see .env.example)
```

## Local Development

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project

### Backend Setup

```bash
cd backend

# Copy env template and fill in your values
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Start dev server (port 3000)
npm run start:dev
```

### Frontend Setup

```bash
# In project root
npm install

# Start dev server (port 5173, proxies /api → localhost:3000)
npm run dev
```

Visit **`http://localhost:5173`**

### Environment Variables

See [`backend/.env.example`](./backend/.env.example) for all required variables.

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/send-code` | Send verification code |
| POST | `/register` | Register with email + code |
| POST | `/login` | Email/password login |
| GET | `/me` | Get current user |
| POST | `/refresh` | Refresh access token |
| POST | `/reset-password` | Reset password with code |
| POST | `/logout` | Logout |

### Users (`/api/users`) — JWT Required
| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/profile` | Get/update profile |
| GET/PUT | `/preferences` | Get/update preferences |
| PATCH | `/password` | Change password |

Swagger docs: **`http://localhost:3000/api/docs`**

## Development Notes

- Verification codes are printed to the **backend console** in development (`NODE_ENV !== 'production'`) and also returned in the API response for easy testing
- JWT: `accessToken` (7 days) + `refreshToken` (30 days)
- All data is isolated by `userId` from JWT — different accounts see different data

## Roadmap

- [x] Phase 1: Infrastructure (NestJS + Prisma + Supabase)
- [x] Phase 2: Auth & Users module + Frontend integration
- [ ] Phase 3: Categories & Transactions
- [ ] Phase 4: AI review (DeepSeek)
- [ ] Phase 5: Dashboard & Analytics
- [ ] Phase 6: Vercel deployment
