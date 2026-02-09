# 👻 GhostGram - Monorepo

> Instagram unfollowers tracker - Chrome Extension + Mobile App + API Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.0-purple)](https://turbo.build/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

## 📦 Packages

This monorepo contains 3 packages:

| Package | Description | Status |
|---------|-------------|--------|
| **[@ghostgram/shared](./packages/shared)** | Shared types, DTOs, domain logic, i18n | ✅ Complete |
| **[@ghostgram/api](./packages/api)** | NestJS API with Supabase PostgreSQL | ✅ Complete |
| **[@ghostgram/extension](./packages/extension)** | Chrome MV3 Extension | ✅ Complete |
| **[@ghostgram/app](./packages/app)** | Expo mobile app (iOS/Android) | ✅ MVP |

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Extension     │────▶│   API NestJS     │◀────│   App Expo      │
│   Chrome MV3    │     │   (Backend)      │     │   (WebView)     │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │   Supabase              │
                    │  ┌──────┐ ┌───────────┐ │
                    │  │ Auth │ │ PostgreSQL │ │
                    │  └──────┘ └───────────┘ │
                    └─────────────────────────┘
                                 │
                          ┌──────┴──────┐
                          │   Stripe    │
                          │  Payments   │
                          └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (optional, for local DB)

### Installation

```bash
# Install dependencies
pnpm install

# Type-check all packages
pnpm run type-check

# Build all packages
pnpm run build

# Run tests
pnpm run test
```

### Development

#### API
```bash
# Start PostgreSQL
docker-compose up postgres

# Run API
cd packages/api
pnpm run dev
```

#### Extension
```bash
cd packages/extension
pnpm run build

# Load ./build in Chrome:
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select ./packages/extension/build
```

#### Mobile App
```bash
cd packages/app
pnpm start

# Then press:
# i - for iOS simulator
# a - for Android emulator
# w - for web
```

## 📊 Features

### Extension
- ✅ Scan Instagram followers
- ✅ Detect non-followers
- ✅ Bulk unfollow
- ✅ Whitelist protection
- ✅ Action history
- ✅ Cooldown system
- ✅ API synchronization

### Mobile App
- ✅ Instagram WebView
- ✅ Login detection
- ✅ Authentication
- ✅ History view
- ✅ Settings
- 🚧 Full scan functionality (WIP)

### API
- ✅ JWT Authentication
- ✅ User management
- ✅ Instagram accounts
- ✅ Scan history
- ✅ Action tracking
- ✅ Whitelist sync
- ✅ Stripe billing
- ✅ Plan limits

## 🗃️ Database Schema

```prisma
User
  ├── id: uuid
  ├── email: string (unique)
  ├── displayName: string?
  ├── locale: string
  └── plan: FREE | PREMIUM

InstagramAccount
  ├── id: uuid
  ├── userId: uuid → User
  ├── igUsername: string
  └── igUserId: string?

Scan
  ├── id: uuid
  ├── accountId: uuid → InstagramAccount
  ├── totalFollowing: int
  ├── nonFollowers: int
  └── resultData: json

ActionHistory
  ├── id: uuid
  ├── accountId: uuid → InstagramAccount
  ├── actionType: string
  ├── targetUsername: string
  └── timestamp: datetime

WhitelistEntry
  ├── id: uuid
  ├── accountId: uuid → InstagramAccount
  └── igUsername: string

Subscription
  ├── id: uuid
  ├── userId: uuid → User
  ├── stripeCustomerId: string
  ├── plan: FREE | PREMIUM
  └── status: ACTIVE | CANCELLED | EXPIRED
```

## 🔒 Environment Variables

### API (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
SUPABASE_URL=...
```

### Mobile App (.env)
```env
API_URL=http://localhost:3001/api/v1
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm run build` | Build all packages |
| `pnpm run dev` | Start all dev servers |
| `pnpm run test` | Run all tests |
| `pnpm run lint` | Lint all packages |
| `pnpm run type-check` | Type-check all packages |
| `pnpm run clean` | Clean all build artifacts |

## 🧪 Testing

```bash
# Extension tests (379 tests)
cd packages/extension
pnpm test

# API tests (TODO)
cd packages/api
pnpm test

# Mobile app tests (TODO)
cd packages/app
pnpm test
```

## 📦 Building for Production

### Extension
```bash
cd packages/extension
pnpm run build:minified
# Output: ./build + extension.zip
```

### API
```bash
cd packages/api
pnpm run build
# Deploy to Railway/Render/Fly.io
```

### Mobile App
```bash
cd packages/app
eas build --platform ios
eas build --platform android
```

## 🌐 Deployment

### API
- Railway (recommended)
- Render
- Fly.io
- Vercel (serverless)

### Database
- Supabase (PostgreSQL + Auth)
- Railway PostgreSQL
- Neon

### Mobile App
- EAS Build + Submit
- App Store
- Google Play Store

### Extension
- Chrome Web Store

## 📄 License

Proprietary - All rights reserved

## 👨‍💻 Development

Created with ❤️ using:
- TypeScript
- NestJS
- Prisma
- React Native / Expo
- pnpm + Turborepo

---

**Total Lines of Code**: ~15,000+  
**Packages**: 4  
**Commits**: 14  
**Development Time**: ~4 hours  
