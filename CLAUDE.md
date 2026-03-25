# CLAUDE.md

## Project

Whitelabel Admin — a white-label admin dashboard built as a pnpm monorepo.

## Tech Stack

- **Runtime**: Node.js 20+
- **Package Manager**: pnpm (workspace)
- **Framework**: Next.js App Router (canary)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (strict)
- **UI Library**: `@whitelabel/ui` (internal package at `packages/ui`)

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (apps/dashboard)
pnpm build            # Build for production
pnpm lint             # Run ESLint
```

## Structure

```
apps/dashboard/       # Next.js app (App Router, src/ directory)
packages/ui/          # Shared UI components
```

## Rules

- All shared components must be exported from `packages/ui/src/index.ts`
- Use `workspace:*` protocol for internal package references
- Keep `packages/ui` framework-agnostic where possible (React only, no Next.js imports)
