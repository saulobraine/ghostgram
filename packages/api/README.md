# @ghostgram/api

GhostGram API - NestJS backend with Supabase PostgreSQL and Stripe integration.

## Features

- 🔐 JWT Authentication (register, login, refresh)
- 👤 User management (profile, plan limits)
- 📸 Instagram account management
- 📊 Scan history storage
- 📝 Action history tracking (follow/unfollow)
- ⭐ Whitelist management
- 💳 Stripe billing integration
- 🛡️ Rate limiting and guards
- 🗃️ Prisma ORM with PostgreSQL

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PATCH /api/v1/users/profile` - Update profile
- `GET /api/v1/users/plan` - Get plan limits
- `GET /api/v1/users/instagram-accounts` - List IG accounts
- `POST /api/v1/users/instagram-accounts` - Add IG account
- `DELETE /api/v1/users/instagram-accounts/:id` - Remove IG account

### Scans
- `POST /api/v1/scans` - Save scan result
- `GET /api/v1/scans` - List scans
- `GET /api/v1/scans/:id` - Get scan detail
- `DELETE /api/v1/scans/:id` - Delete scan

### History
- `POST /api/v1/history/sync` - Sync actions
- `GET /api/v1/history` - Get action history
- `GET /api/v1/history/stats` - Get stats
- `DELETE /api/v1/history` - Clear history

### Whitelist
- `GET /api/v1/whitelist` - Get whitelist
- `POST /api/v1/whitelist` - Add to whitelist
- `DELETE /api/v1/whitelist/:username` - Remove from whitelist
- `POST /api/v1/whitelist/sync` - Sync whitelist

### Billing
- `POST /api/v1/billing/checkout` - Create Stripe checkout
- `POST /api/v1/billing/portal` - Get billing portal
- `GET /api/v1/billing/subscription` - Get subscription
- `POST /api/v1/billing/webhooks` - Stripe webhooks

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Run database migrations:
```bash
pnpm prisma:migrate
```

4. Start development server:
```bash
pnpm run dev
```

## Docker Development

```bash
# From repository root
docker-compose up
```

## Database Schema

- **users** - User accounts
- **instagram_accounts** - Connected IG accounts
- **scans** - Scan results
- **action_history** - Follow/unfollow actions
- **whitelist** - Protected users
- **subscriptions** - Stripe subscriptions

## Environment Variables

See `.env.example` for required variables:
- Database URL (Supabase PostgreSQL)
- JWT secrets
- Stripe keys
- API configuration
