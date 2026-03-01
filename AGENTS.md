# AGENTS.md

## Project Overview

This repository is a full-stack TypeScript app built with Next.js (App Router), React, and Convex.

- Frontend framework: Next.js + React (`app/`)
- Auth: Clerk (`@clerk/nextjs`)
- Backend + storage: Convex (`convex/`)
- Styling/UI: Tailwind CSS + shared UI primitives
- Charts: `recharts`

## Repository Structure

- `app/`: Next.js routes, layouts, and page-level UI.
  - `app/page.tsx`: client-rendered home page using Convex React hooks.
  - `app/server/`: server component examples with Convex preloading.
- `components/`: shared React components.
  - `components/ui/`: ready-to-use UI components. Prefer reusing these before adding new primitives.
  - `components/ConvexClientProvider.tsx`: Convex + Clerk client wiring.
- `convex/`: backend/server logic and schema.
  - `schema.ts`: Convex data model.
  - `myFunctions.ts`: example queries/mutations/actions.
  - `_generated/`: auto-generated Convex types and helpers (do not edit manually).
- `hooks/`: reusable React hooks.
- `lib/`: shared utilities (`lib/utils.ts`).
- `public/`: static assets.

## Key Conventions For Agents

- Prefer existing components in `components/ui` for UI work.
- Use `recharts` for charting and data visualizations.
- Use Convex for backend logic and persistent data:
  - Queries for reads
  - Mutations for writes
  - Actions for external API or orchestrated server tasks
- For Convex-related tasks, follow the rules in `.cursor/rules/convex_rules.mdc`.
- Keep Convex schema and functions in `convex/`; never hand-edit files in `convex/_generated/`.
- Use `@/*` path aliases where appropriate.

## Common Commands

- `pnpm dev`: run frontend and Convex backend in parallel.
- `pnpm build`: production build.
- `pnpm lint`: run ESLint.
