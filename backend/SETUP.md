# EasyBill AI Backend

AI-powered expense tracking and financial management backend API built with NestJS, Prisma, and Supabase.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Cache**: Redis (local or Upstash)
- **Authentication**: JWT + Passport
- **AI Integration**: DeepSeek API
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Supabase account (free tier available)
- Redis (optional, for caching)

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - Project name: `easybill-ai`
   - Database password: (save this securely)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)

### 2. Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Configure Environment Variables

1. Copy `.env` file and update the `DATABASE_URL`:
   ```bash
   DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

2. Update other environment variables as needed:
   - JWT secrets
   - Email SMTP settings
   - AI API keys
   - OAuth credentials (optional)

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Database Migrations

```bash
npx prisma migrate deploy
```

This will create all the necessary tables in your Supabase database.

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Seed Initial Data (Optional)

```bash
npm run seed
```

This will populate the database with initial categories and test data.

### 8. Start the Development Server

```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs

## Redis Setup (Optional)

### Option 1: Local Redis with Docker

```bash
docker run -d --name easybill-redis -p 6379:6379 redis:7-alpine
```

### Option 2: Upstash Redis (Cloud)

1. Go to [https://upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the connection string
4. Update `.env`:
   ```
   REDIS_HOST=your-endpoint.upstash.io
   REDIS_PORT=6379
   ```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── main.ts                # Application entry point
│   ├── app.module.ts          # Root module
│   ├── common/                # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── config/                # Configuration
│   ├── prisma/                # Prisma service
│   └── modules/               # Feature modules
│       ├── auth/              # Authentication
│       ├── users/             # User management
│       ├── transactions/      # Transactions
│       ├── ai-items/          # AI audit
│       ├── analysis/          # AI analysis
│       ├── dashboard/         # Dashboard stats
│       └── categories/        # Categories
└── test/                      # Tests
```

## Available Scripts

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start in debug mode

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npx prisma migrate dev     # Create and apply migration
npx prisma migrate deploy  # Apply migrations (production)
npx prisma generate        # Generate Prisma Client
npx prisma studio          # Open Prisma Studio GUI

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Run tests with coverage

# Linting
npm run lint               # Lint code
npm run format             # Format code
```

## API Documentation

Once the server is running, visit http://localhost:3000/api/docs to see the interactive Swagger API documentation.

## Database Schema

The application uses the following main tables:

- **users**: User accounts and profiles
- **oauth_accounts**: Third-party OAuth connections
- **verification_codes**: Email verification codes
- **user_preferences**: User settings (currency, language, theme)
- **categories**: Transaction categories
- **transactions**: Financial transactions
- **ai_pending_items**: AI-parsed transactions awaiting confirmation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | Supabase PostgreSQL connection string | Yes |
| JWT_SECRET | Secret key for JWT tokens | Yes |
| JWT_REFRESH_SECRET | Secret key for refresh tokens | Yes |
| REDIS_HOST | Redis host | No |
| REDIS_PORT | Redis port | No |
| SMTP_HOST | Email SMTP host | Yes (for verification) |
| SMTP_USER | Email SMTP username | Yes (for verification) |
| SMTP_PASS | Email SMTP password | Yes (for verification) |
| DEEPSEEK_API_KEY | DeepSeek AI API key | Yes (for AI features) |
| GOOGLE_CLIENT_ID | Google OAuth client ID | No |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | No |

## Troubleshooting

### Database Connection Issues

1. Verify your Supabase project is active
2. Check that the DATABASE_URL is correct
3. Ensure your IP is not blocked (Supabase allows all IPs by default)
4. Try using the direct connection string instead of pooler

### Migration Issues

If migrations fail:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually apply migrations
npx prisma migrate deploy
```

### Prisma Client Issues

If you get Prisma Client errors:
```bash
# Regenerate Prisma Client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

## Support

For issues and questions:
- Check the [API documentation](http://localhost:3000/api/docs)
- Review the [Supabase documentation](https://supabase.com/docs)
- Check the [NestJS documentation](https://docs.nestjs.com)
- Review the [Prisma documentation](https://www.prisma.io/docs)

## License

MIT
