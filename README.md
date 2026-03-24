# Whitelabel Admin

A white-label admin dashboard built with Next.js, Tailwind CSS v4, and TypeScript in a pnpm monorepo.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
whitelabel-admin/
├── apps/
│   └── dashboard/        # Next.js App Router app
├── packages/
│   └── ui/               # Shared UI component library (@whitelabel/ui)
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `dashboard` | `apps/dashboard` | Next.js App Router dashboard |
| `@whitelabel/ui` | `packages/ui` | Shared UI components |
