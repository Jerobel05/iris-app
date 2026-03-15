# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── iris-app/           # Iris Email & Calendar AI frontend (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Iris App — `artifacts/iris-app`

The main Iris application is a React + Vite frontend with the following pages:

- **Login page** (`/`) — split layout: left with login form, right with animated preview card
- **Home** (`/home`) — power orb to activate Iris email analysis
- **Emails** (`/emails`) — focused/other tabs with email cards and action buttons (Prepare event, Create follow-up)
- **Tasks** (`/tasks`) — task cards with Accept plan, Plan 60 min actions
- **Analysis** (`/analysis`) — Analytics with time saved stats, intent mix donut chart, weekly rhythm heatmap

### Color scheme
- Dark mode (default): deep brown/dark background `hsl(20 10% 12%)`, orange primary `hsl(25 85% 52%)`
- Light mode: warm beige background `hsl(35 30% 94%)`, orange primary same
- Toggle available via "Mode clair/sombre" in sidebar

### Features
- Dark/light mode toggle
- Settings panel slide-in (connected apps toggles, profile, notifications, scan mode)
- Navigation between pages via sidebar
- Collapsible sidebar

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/iris-app` (`@workspace/iris-app`)

React + Vite frontend for Iris. No backend needed — all data is mock/static for now.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package.
