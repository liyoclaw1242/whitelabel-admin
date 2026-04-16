# State Conventions — Loading / Empty / Error

> **Status**: Spec for FE #142 + future Phase 2 features
> **Parent**: #112 Phase 2 / #143 DESIGN task
> **Author**: `design-20260414-1014218`
> **Date**: 2026-04-16

## Why this doc exists

Phase 2 introduces real network calls (data layer #141 + auth flow #142). Every async surface needs a deterministic answer to three questions:

1. **What does the user see while it's loading?**
2. **What does the user see when it succeeds but there's nothing to show?**
3. **What does the user see when it fails?**

Without a convention, every page reinvents these three states slightly differently and the product feels janky. This doc fixes that.

## Design principle: compose, don't invent

`packages/ui` already ships every primitive we need. We do **not** add new low-level components. Instead, we ship three small **wrapper components** under `packages/ui/src/components/state/` that compose existing primitives into the canonical shape. This keeps the design system honest and means every state surface looks the same without per-page styling decisions.

| Primitive (already exists) | Used by |
|---|---|
| `Spinner` | `LoadingState` |
| `Skeleton` | `LoadingState` (skeleton variant) |
| `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription` | `EmptyState`, `ErrorState` |
| `Alert`, `AlertTitle`, `AlertDescription` (`destructive` variant) | `ErrorState` (inline variant) |
| `Button` | `EmptyState` CTA, `ErrorState` retry |

Adopt the existing tokens from `design-decisions.md`:

- Outer container ring: `ring-1 ring-foreground/[0.08]`
- Eyebrow / monospace label: `text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono`
- Body description: `text-sm text-muted-foreground max-w-[60ch]`
- Spacing between sections: `space-y-8`

---

## When to use which

The single most-asked question is "inline or full-page?". The answer:

| If the feature is… | Use |
|---|---|
| The **whole page** (route-level data, e.g. `/users` list) | Full-page state |
| A **section** of a page (a card, a panel, a side widget) | Section state (same component, smaller container) |
| A **single field** (form validation, inline confirmation) | Inline `Alert` — do **not** wrap in `<ErrorState>` |
| A **transient action** (save succeeded, copied to clipboard) | Toast (`sonner`) — do **not** wrap in `<LoadingState>` |

Rule of thumb: if removing the surface would leave the user with nothing to do, it's full-page; otherwise it's section. Toasts are reserved for confirmations of completed actions, never for blocking states.

---

## `<LoadingState>`

### Purpose

Indicate "data is in flight, no content yet". One canonical look so users learn it instantly.

### Two variants

- **Spinner** (default): when the loading time is expected to be short (<1s) or the surface is small.
- **Skeleton**: when the layout is known and the loading time may be perceptible (>1s) — gives the user a structural preview.

### Visual

```
┌──────────────────────────────────────────────┐
│                                              │
│             ⟳  Loading users…                │
│                                              │
└──────────────────────────────────────────────┘

(spinner variant — Spinner.size=5, gap-3, message in text-sm text-muted-foreground)
```

```
┌──────────────────────────────────────────────┐
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒                              │  ← Skeleton h-4 w-1/3
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                  │  ← Skeleton h-3 w-2/3 (mt-2)
│                                              │
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒                              │
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                  │
│                                              │
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒                              │
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                  │
└──────────────────────────────────────────────┘

(skeleton variant — three rows mirroring the eventual list shape)
```

### Component API (draft for FE)

```ts
interface LoadingStateProps {
  /** Default 'spinner'. Use 'skeleton' when layout is known and waits >1s. */
  variant?: "spinner" | "skeleton";
  /** Optional caption shown next to spinner. Ignored in skeleton variant. */
  message?: string;
  /** Number of skeleton rows. Ignored in spinner variant. Default 3. */
  rows?: number;
  /** When true, takes full container height (min-h-[280px]) for full-page use. */
  fullPage?: boolean;
  /** ARIA. Defaults to "Loading content". Override when context warrants. */
  label?: string;
}
```

### Accessibility

- Spinner: relies on `Spinner`'s built-in `role="status" aria-label="Loading"`.
- Skeleton: wrapper sets `role="status" aria-busy="true" aria-label={label ?? "Loading content"}` and `aria-live="polite"` so screen readers announce when content arrives.
- Never animate without honoring `prefers-reduced-motion`. (Tailwind's `animate-pulse` and `animate-spin` already do.)

---

## `<EmptyState>`

### Purpose

Communicate "this loaded successfully and is genuinely empty — here's what to do about it". Distinct from loading and error: the network call **succeeded**.

### Visual

```
┌──────────────────────────────────────────────┐
│                                              │
│                  ┌────┐                      │
│                  │ 👥 │   ← EmptyMedia icon  │
│                  └────┘     (size-8, bg-muted)
│                                              │
│            No team members yet               │  ← title (font-heading text-sm font-medium)
│                                              │
│   Invite your first teammate to get          │  ← description (text-muted-foreground)
│            started with reviews.                │     max-w-sm, balanced
│                                              │
│           ┌──────────────────┐               │
│           │   Invite member  │   ← optional CTA button
│           └──────────────────┘               │
│                                              │
└──────────────────────────────────────────────┘
```

### When to use vs not

- **Use** when an authenticated user lands on a list/grid that returned `[]`.
- **Use** for "no search results" (with the query echoed in the message).
- **Don't use** for first-time onboarding *guidance* on populated screens — that's an inline `<Alert>` or onboarding tour, not an empty state.

### Component API (draft for FE)

```ts
interface EmptyStateProps {
  /** Lucide icon component. Optional but strongly recommended. */
  icon?: LucideIcon;
  /** Required short title. e.g. "No team members yet". */
  title: string;
  /** Optional one-sentence supporting copy. */
  description?: string;
  /** Optional CTA. */
  action?: {
    label: string;
    onClick?: () => void;
    /** When provided, renders Button as an <a> via the `render` prop. */
    href?: string;
  };
  /** When true, takes full container height for full-page use. */
  fullPage?: boolean;
  /** Override the underlying Empty container className for spacing tweaks. */
  className?: string;
}
```

### Accessibility

- `EmptyTitle` is the most-prominent text → use semantic `<h2>` via the `render` prop on `EmptyTitle` when used at page level (not a div) so it joins the page heading hierarchy.
- CTA `Button` inherits standard focus ring (`focus-visible:ring-3 focus-visible:ring-ring/50`).

---

## `<ErrorState>`

### Purpose

The async operation failed and the user is **stuck** until they take action. The most important job is showing them what to do next: usually "retry", sometimes "go back", sometimes "contact support".

### Two variants

- **Full-page** (default): when the page itself failed to load — there is no content to fall back to.
- **Inline**: when only one section failed — the rest of the page is still useful.

### Source of error text

All API errors come through `ProblemError` (RFC 7807, see `lib/api.ts` from #141). Three fields drive the UI:

| Field | UI role |
|---|---|
| `title` (RFC 7807) | `ErrorState` title — short, human, e.g. "Couldn't load users" |
| `detail` (RFC 7807) | `ErrorState` description — actionable explanation |
| `status` | Determines icon + tone: 4xx = `AlertTriangle` warning, 5xx = `XOctagon` destructive |

The `type` (URI) and `instance` (request id) fields go into a collapsible `<details>` block for debugging — never the primary surface.

### Visual — full-page variant

```
┌──────────────────────────────────────────────┐
│                                              │
│                  ┌────┐                      │
│                  │ ⚠  │   ← destructive icon │
│                  └────┘                      │
│                                              │
│          Couldn't load users                 │  ← from ProblemError.title
│                                              │
│  The server is taking too long to            │  ← from ProblemError.detail
│  respond. Try again in a moment.             │
│                                              │
│      ┌─────────┐   ┌──────────────┐          │
│      │  Retry  │   │  Go to home  │          │
│      └─────────┘   └──────────────┘          │
│                                              │
│       ▸ Show technical details               │  ← collapsed <details>
│                                              │
└──────────────────────────────────────────────┘
```

### Visual — inline variant

Renders as a `destructive` `Alert` with a retry button on the right. Use this inside a card or panel when only that section failed.

```
┌──────────────────────────────────────────────┐
│  ⚠  Couldn't load notifications     [Retry] │
│     The server is taking too long…           │
└──────────────────────────────────────────────┘

(Alert variant=destructive, AlertAction button on right)
```

### Component API (draft for FE)

```ts
interface ErrorStateProps {
  /** RFC 7807 ProblemError or any Error with a message. */
  error: ProblemError | Error;
  /** Layout. Defaults to 'full' when used outside a card; 'inline' inside one. */
  variant?: "full" | "inline";
  /** Click handler for the retry action. When omitted, no Retry button is shown. */
  onRetry?: () => void;
  /** Secondary action — usually "Go home" on full-page errors. */
  secondaryAction?: { label: string; href: string };
  /** Hide the technical-details disclosure. Default false. */
  hideTechnical?: boolean;
}
```

### Accessibility

- `Alert` already sets `role="alert"` — screen readers announce immediately. Do not also add `aria-live`; double-announces are confusing.
- Retry `Button` must be focusable and operable via keyboard. Default focus moves to the Retry button when an `ErrorState` mounts at full-page level (not inline — that would steal focus from the rest of the page).
- The `<details>` block uses native HTML disclosure, which is keyboard-accessible by default.

---

## File layout (for FE #142 to implement)

```
packages/ui/src/components/state/
  ├── loading-state.tsx
  ├── empty-state.tsx
  ├── error-state.tsx
  └── index.ts            ← re-exports

packages/ui/src/index.ts  ← add `export * from "./components/state"`
```

Each component is ~40–80 lines: it composes existing primitives, applies the conventions in this doc, and exports the props interface above. No new tokens, no new variants — if a use case appears that doesn't fit, raise it as a follow-up DESIGN issue rather than forking the component.

---

## Quick decision matrix

| Situation | Component | Variant |
|---|---|---|
| Route-level fetch in flight | `<LoadingState>` | `skeleton` if known layout; else `spinner` |
| Section fetch in flight | `<LoadingState>` | `spinner` |
| List loaded, returned `[]` | `<EmptyState>` | (only one) |
| Page fetch failed | `<ErrorState>` | `full` |
| Section fetch failed | `<ErrorState>` | `inline` |
| Form field invalid | `<Alert variant="destructive">` | (inline only — not `ErrorState`) |
| Action succeeded | `toast.success()` (`sonner`) | (inline only — not a state component) |
