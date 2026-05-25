# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GhostGram is an Instagram unfollowers tracker — a **pnpm + Turborepo monorepo** with a Chrome Extension (MV3), NestJS API, Expo mobile app, desktop Electron wrapper, and a shared library. All packages depend on `@ghostgram/shared` for types, DTOs, domain objects, and i18n.

**Language convention**: Code identifiers in English; comments, logs, UI strings, and commit messages in **Brazilian Portuguese**.

## Build & Development Commands

```bash
# Root-level (via Turborepo)
pnpm install                # Install all dependencies (requires pnpm 9+, Node 20+)
pnpm run build              # Build all packages
pnpm run test               # Test all packages
pnnpm run lint               # Lint all packages
pnpm run type-check         # TypeScript check all packages
pnpm run clean              # Clean build artifacts + node_modules

# Development servers
pnpm run dev:extension      # Vite dev (load dist/ as unpacked extension in Chrome)
pnpm run dev:api            # NestJS --watch on port 3001
pnpm run dev:app            # Expo dev server
pnpm run dev:desktop        # Electron + web app concurrently
pnpm run dev:fullstack      # API + App concurrently
pnpm run dev:all            # API + App + Extension concurrently

# Extension testing (requires --experimental-vm-modules)
cd packages/extension
pnpm test                   # All tests
pnpm run test:unit          # Unit tests only
pnpm run test:integration   # Integration tests
pnpm run test:performance   # Performance benchmarks
pnpm run test:e2e           # Puppeteer E2E
# Single test file:
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/domain/User.test.ts

# API testing & tools
cd packages/api
pnpm test                   # Jest (testRegex: *.spec.ts)
pnpm run test:e2e           # E2E tests
pnpm run lint               # ESLint + Prettier
pnpm run format             # Prettier write
pnpm run prisma:migrate     # Run Prisma migrations
pnpm run prisma:generate    # Regenerate Prisma client
pnpm run prisma:studio      # Prisma Studio GUI

# Database
docker-compose up postgres  # PostgreSQL 16 on port 5432

# Production builds
cd packages/extension && pnpm run build:minified   # Minified build + zip
cd packages/api && pnpm run build                  # NestJS build
cd packages/app && eas build --platform ios        # EAS build iOS
cd packages/app && eas build --platform android    # EAS build Android
```

## Architecture

```
Extension (Chrome MV3) ──► API (NestJS) ◄── App (Expo/React Native)
                                │                    ▲
                    Supabase (Auth + PostgreSQL) + Stripe
                                                     │
                                        Desktop (Electron wrapper)
```

### Shared Package (`@ghostgram/shared`)

Pure TypeScript — zero runtime dependencies. Subpath exports:

| Subpath | Contents |
|---------|----------|
| `@ghostgram/shared` | Barrel index |
| `@ghostgram/shared/types` | Domain types and interfaces |
| `@ghostgram/shared/constants` | Shared constants |
| `@ghostgram/shared/domain` | Value Objects (User, Filter, UnfollowLogEntry, Whitelist) |
| `@ghostgram/shared/dto` | Data Transfer Objects |
| `@ghostgram/shared/i18n` | Translations (pt-BR, en) |
| `@ghostgram/shared/utils` | Validators and helpers |

### Extension — Five Isolated Contexts (`packages/extension`)

The extension runs across five contexts communicating via `chrome.runtime` messaging and `window.postMessage`:

1. **Background Service Worker** (`src/background/`) — `BackgroundService` orchestrates message routing, tab monitoring, install handling.
2. **Content Script** (`content-main.ts`) — Bridge between page context and background. Uses `window.postMessage` (type `GHOSTGRAM_TO_BACKGROUND`) ↔ `chrome.runtime.sendMessage`.
3. **Injected Bundle** (`src/bundle/`) — Runs in the page context (no `chrome.runtime` access). Contains `FloatingPanelApp` (main orchestrator), UI components, domain objects, services, and Instagram API client. Manual DOM manipulation — no framework.
4. **Popup** (`src/popup/`) — Quick toggle and status display.
5. **Options Page** (`src/options/`) — Settings configuration.

**Compilation model**: TypeScript compiles via Vite (`@crxjs/vite-plugin`). The bundle in `src/bundle/` is loaded at runtime via `chrome.runtime.getURL()` in the page context. Build output goes to `build/`.

**Extension Dependency Hierarchy**:
```
domain/ (no deps) → services/ (domain/utils/constants) → components/ (domain/services/utils) → storage/ (independent)
```

### API Structure (`packages/api`)

NestJS 10 with Prisma ORM and Supabase PostgreSQL.

| Module | Purpose |
|--------|---------|
| `auth/` | Passport JWT authentication, refresh tokens |
| `billing/` | Stripe subscription management |
| `users/` | User CRUD and profile |
| `scans/` | Scan history and results |
| `history/` | Action history tracking |
| `whitelist/` | Whitelist entry CRUD and sync |
| `common/` | Decorators, filters, guards, interceptors, Prisma service |

**Database Schema** (Prisma):
```
User (id, email, displayName, locale, plan: FREE|PREMIUM)
  └── InstagramAccount (id, igUsername, igUserId)
        ├── Scan (id, totalFollowing, nonFollowers, resultData: json)
        ├── ActionHistory (id, actionType, targetUsername, timestamp)
        └── WhitelistEntry (id, igUsername)
Subscription (id, userId, stripeCustomerId, plan, status: ACTIVE|CANCELLED|EXPIRED|PAST_DUE)
```

**Environment variables** (`packages/api/.env`): `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_*_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID`, `THROTTLE_TTL`, `THROTTLE_LIMIT`, `PORT`, `NODE_ENV`, `FRONTEND_URL`.

### Mobile App (`packages/app`)

Expo ~54.0.0 / React Native ~0.81.0 / React 19.1.0 with expo-router v6 (file-based routing).

- Uses `WebView` for Instagram login flow with login detection
- `expo-secure-store` for token persistence
- `react-native-webview` for embedded Instagram auth
- `react-native-web` for web support
- Depends on `@ghostgram/shared` for domain types and DTOs

### Desktop (`packages/desktop`)

Electron 33 wrapper around the Expo web build.

- Depends on `../app/dist/` (must build app first)
- Single entry point: `src/main.ts`
- Build targets: NSIS (Windows), DMG (macOS), AppImage (Linux)
- TypeScript compiles to `out/`

## Key Conventions

### Naming

- Classes: `PascalCase` with role suffixes — `*Service`, `*Adapter`, `*Repository`, `*Controller`
- Private members: `_` prefix — `this._apiClient`, `_validate()`
- Constants: `UPPER_SNAKE_CASE`, centralized in `Constants.ts`. Always use `STORAGE_KEYS` constants, never hardcoded strings for storage operations.
- Files: `PascalCase` matching the exported class
- Booleans: `is*`, `has*`, `should*` prefixes

### Class Member Order

1. Private properties (`_property`)
2. Constructor
3. Static methods (`createDefault()`, `fromObject()`)
4. Public methods
5. Private methods (`_method()`)

### Value Objects (DDD)

Domain objects follow: constructor validation → private `_` properties → getters (no setters) → `toObject()` for serialization → `static fromObject()` for deserialization → `equals()` for comparison. Only create Value Objects where validation or behavior exists — avoid over-abstracting simple data.

### Extension UI Components

Manual DOM rendering: `render(props)` returns `HTMLElement`, `update(props)` modifies in place. No framework.

### Extension Imports

- Always include `.js` extension in import paths (ESM browser context requirement)
- Prefer named exports over default exports
- Import order: externals → project relatives → constants

### Commit Messages

Conventional Commits in Portuguese: `tipo(escopo): descrição`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
Scopes: `floating-panel`, `scan`, `unfollow`, `storage`, `background`, `popup`, `options`, `domain`, `services`, `components`, `api`, `app`, `shared`

Example: `feat(scan): adiciona persistência de estado`

### Code Style

- Early returns instead of else blocks (Object Calisthenics)
- One collection operation per line
- No abbreviations in variable names
- Classes max 200-300 lines
- `async/await` over `.then()`
- Prefix logs with class name: `[ClassName]`
- Getters only (no setters) for encapsulated properties

### Anti-Overengineering

- YAGNI — don't create interfaces/factories/builders without 2+ implementations
- No premature abstractions
- The extension intentionally uses manual DOM instead of React to keep the bundle small and avoid framework overhead in the page context

### Security (Extension)

- Minimal permissions: `storage`, `cookies`, `activeTab`, `scripting`
- Host permissions limited to `https://www.instagram.com/*`
- No `eval()` or dynamic `Function()` — CSP violation
- Validate message origins for `window.postMessage`
- Rate limit Instagram API calls with random delays and strategic pauses

## Regras do Projeto — Resumo

Abaixo estão regras consolidadas dos arquivos `.cursor/rules/` que complementam as convenções acima.

### SOLID e Object Calisthenics

**SRP**: Cada classe uma única responsabilidade. Ex: `ScanService` só escaneia, `UnfollowService` só faz unfollow.

**OCP**: `StorageAdapter` abstrato permite `LocalStorageAdapter` e `SyncStorageAdapter` sem modificar a base.

**DIP**: Injetar dependências no construtor ao invés de instanciar internamente.

**Object Calisthenics principais**:
- Um nível de indentação por método (extrair lógica para métodos privados)
- Não usar `else` (usar early returns/guard clauses)
- Uma operação de coleção por linha
- Sem abreviações em variáveis (`user` não `u`, `isScanning` não `scan`)
- Classes com no máximo 200-300 linhas

### Evitar Overengineering

Não criar interfaces, factories, builders ou padrões complexos sem necessidade comprovada. Soluções diretas sempre preferíveis. Adicionar complexidade apenas quando resolve problema real, não hipotético.

### Separation of Concerns

Hierarquia de dependências — camadas superiores dependem de inferiores, nunca o contrário:
1. **Domain**: Value Objects puros, sem dependências externas
2. **Services**: Lógica de negócio, orquestração
3. **Storage**: Persistência, adapters
4. **Components**: Renderização UI
5. **Utils**: Funções auxiliares reutilizáveis

### Segurança (API)

- JWT com refresh tokens
- Supabase Auth para gerenciamento de usuários
- Stripe para billing com webhooks
- Throttle configurável (`THROTTLE_TTL`, `THROTTLE_LIMIT`)

### i18n

- Traduções em `@ghostgram/shared/i18n` (pt-BR e en)
- UI strings devem usar o sistema de i18n, nunca strings hardcoded
- Configuração de locale no modelo `User` (`locale: string`)
