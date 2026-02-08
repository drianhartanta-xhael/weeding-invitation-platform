# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install all dependencies (run from root)
npm install

# Start MongoDB via Docker
docker-compose up -d

# Run all apps in parallel (web:3000, invitation:3001, server:5000)
npm run dev

# Run individual apps
npm run dev:web          # Admin dashboard on port 3000
npm run dev:invitation   # Invitation template on port 3001
npm run dev:server       # Express API on port 5000

# Build
npm run build            # Build all
npm run build:web
npm run build:invitation
npm run build:server

# Lint (TypeScript type-check)
npm run lint

# Type-check server only
cd server && npx tsc --noEmit

# Generate static invitation site
npm run generate -- --slug=<client-slug>
```

There are no tests configured yet.

## Architecture

This is a **Turborepo monorepo** with npm workspaces for a wedding invitation platform. The business model: each wedding couple (client) gets a personalized static invitation site.

### Workspaces

- **`apps/web`** — Next.js 14 (App Router) admin dashboard. Uses route groups: `(auth)` for login/register, `(dashboard)` for authenticated pages. Axios client in `src/lib/api.ts` auto-attaches JWT from localStorage and redirects to `/login` on 401.
- **`apps/invitation`** — Next.js 14 (App Router) public-facing invitation. Dynamic route `[slug]` loads invitation data. Guest personalization via `?to=<guestSlug>` query param. Uses Framer Motion for scroll animations. CSS variables (`--wedding-primary`, etc.) enable per-template theming.
- **`server`** — Express + TypeScript API. Uses `tsx watch` for dev (not ts-node). Entry point: `src/index.ts`. All routes under `/api` prefix.
- **`packages/shared`** — TypeScript type definitions only (no runtime code). Referenced as `@wedding/shared` across all workspaces.

### Server Architecture

Routes → Controllers → Models pattern with Zod validation at the controller level.

**Public routes** (no auth): invitation fetching, RSVP submission, wish creation, gift payment, Midtrans webhook.
**Protected routes** (JWT Bearer token): all CRUD for clients/guests/wishes/gifts, user profile.

The auth middleware (`src/middleware/auth.ts`) populates `req.user` from JWT. Error handler (`src/middleware/errorHandler.ts`) catches Zod errors (400), Mongoose CastError (400), duplicate key (409), and defaults to 500.

### Payment Flow (Midtrans)

Gift creation (`POST /api/gifts`) creates a Mongoose document + Midtrans Snap transaction, returning a `snapToken` for the frontend popup. The webhook (`POST /api/gifts/notification`) updates gift status based on Midtrans transaction_status (capture/settlement → success, cancel/deny/expire → failed).

### Data Model Relationships

- `User` → owns many `Client` (via `userId`)
- `Client` → has many `Guest`, `Wish`, `Gift` (via `clientId`)
- `Client` → references `Template` (via `templateId`)
- `Guest` has compound unique index on `(clientId, slug)` for per-client personalization

## Key TypeScript Quirks

- `midtrans-client` has no `@types` — custom declaration at `server/src/types/midtrans-client.d.ts`
- JWT `expiresIn` requires explicit cast: `{ expiresIn } as jwt.SignOptions` for newer `@types/jsonwebtoken`
- Mongoose `toJSON` transform must use destructuring (not `delete`) under strict TypeScript
- Both Next.js apps need `.eslintrc.json` present to avoid interactive ESLint setup prompts during lint/build

## Environment Setup

Copy `.env.example` to `.env` in the root and `server/` directory. Key variables:
- `MONGODB_URI` — defaults to `mongodb://localhost:27017/wedding-invitation`
- `JWT_SECRET` — signing key for auth tokens
- `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` — use `SB-Mid-*` prefixed keys for sandbox
- `NEXT_PUBLIC_API_URL` — backend URL, consumed by both frontend apps
