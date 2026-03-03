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
pnpm run lint               # Lint all packages
pnpm run type-check         # TypeScript check all packages

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
```

## Architecture

```
Extension (Chrome MV3) ──► API (NestJS) ◄── App (Expo/React Native)
                                │
                    Supabase (Auth + PostgreSQL) + Stripe
```

### Extension — Five Isolated Contexts

The extension runs across five contexts communicating via `chrome.runtime` messaging and `window.postMessage`:

1. **Background Service Worker** (`src/background/`) — `BackgroundService` orchestrates message routing, tab monitoring, install handling.
2. **Content Script** (`content-main.ts`) — Bridge between page context and background. Uses `window.postMessage` (type `GHOSTGRAM_TO_BACKGROUND`) ↔ `chrome.runtime.sendMessage`.
3. **Injected Bundle** (`src/bundle/`) — Runs in the page context (no `chrome.runtime` access). Contains `FloatingPanelApp` (main orchestrator), UI components, domain objects, services, and Instagram API client. Manual DOM manipulation — no framework.
4. **Popup** (`src/popup/`) — Quick toggle and status display.
5. **Options Page** (`src/options/`) — Settings configuration.

**Dual JS/TS files**: The extension has both `.ts` and `.js` versions. TypeScript compiles via Vite, but `.js` files in `src/bundle/` are loaded at runtime via `chrome.runtime.getURL()` in the page context.

### Extension Dependency Hierarchy

```
domain/ (no deps) → services/ (domain/utils/constants) → components/ (domain/services/utils) → storage/ (independent)
```

### API Structure

NestJS 10 with Prisma ORM and Supabase PostgreSQL. Modules: `auth/` (Passport JWT), `billing/` (Stripe), `users/`, `scans/`, `history/`, `whitelist/`. Common infrastructure in `common/` (decorators, filters, guards, interceptors, Prisma service).

### Shared Package (`@ghostgram/shared`)

Pure TypeScript — types, constants, domain value objects (User, Filter, UnfollowLogEntry, Whitelist), DTOs, i18n (pt-BR, en), and validators. Zero runtime dependencies.

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
