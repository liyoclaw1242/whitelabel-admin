# AGENTS.md

This file provides guidance to AI coding agents working on this project.

## Project Structure

This is a pnpm monorepo with the following packages:

- `apps/dashboard` — Next.js App Router dashboard application
- `packages/ui` — Shared UI component library (`@whitelabel/ui`)

## Development

```bash
pnpm install    # Install all dependencies
pnpm dev        # Start the dashboard dev server
pnpm build      # Production build
```

## Conventions

- Use TypeScript strict mode
- Use Tailwind CSS v4 for styling
- Shared components go in `packages/ui`, app-specific components in `apps/dashboard/src`
- Use App Router conventions (layout.tsx, page.tsx, loading.tsx, error.tsx)
