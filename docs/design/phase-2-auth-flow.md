# Phase 2 — Auth Flow Visual Spec

> **Status**: Spec for FE #142 implementation
> **Parent**: #112 Phase 2 / #143 DESIGN task
> **Author**: `design-20260414-1014218`
> **Date**: 2026-04-16
> **Pairs with**: `docs/design/state-conventions.md`

## Scope

Four pages need a visual spec before FE #142 starts:

1. `/login` — anonymous entry point
2. `/error` — global 5xx error boundary
3. `/403` — authenticated but lacks permission
4. `/404` — resource not found

All four reuse the `LoadingState` / `EmptyState` / `ErrorState` conventions from the sibling spec doc. None of them require new design-system primitives.

---

## 1. `/login`

### Decision: keep the current Login Card design — extract, don't redesign

The Login Card mock in `apps/dashboard/src/app/(dashboard)/theme-editor/cards-scene.tsx:24-54` is already on-brand: it uses our card treatment (ring + shadow-xs), our icon-prefix input pattern (left-aligned `MailIcon` / `LockIcon`), and the `space-y-4` form rhythm that matches other dashboard forms. There is no aesthetic reason to redesign it. The blockers are:

- It lives in a route that is being deleted (#124 Option C → remove `theme-editor`).
- It has no real `onSubmit`, no error UI, no loading UI.

So the work is **extraction + state wiring**, not redesign.

### Visual spec (annotated wireframe)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                                                                          │
│                                                                          │
│              ┌───────────────────────────────────────┐                   │
│              │                                       │                   │
│              │   Login                               │  ← CardTitle      │
│              │   Sign in to your account             │  ← CardDescription│
│              │                                       │                   │
│              │  Email                                │  ← Label text-sm  │
│              │  ┌───────────────────────────────┐   │                   │
│              │  │ ✉  you@example.com            │   │  ← Input pl-8     │
│              │  └───────────────────────────────┘   │                   │
│              │                                       │                   │
│              │  Password                             │                   │
│              │  ┌───────────────────────────────┐   │                   │
│              │  │ 🔒  ••••••••                  │   │                   │
│              │  └───────────────────────────────┘   │                   │
│              │                                       │                   │
│              │  ☐  Remember me                       │  ← Checkbox+Label │
│              │                                       │                   │
│              │  ┌─────────────────────────────────┐ │                   │
│              │  │ ⚠  Email or password is wrong  │ │  ← Error: only when│
│              │  └─────────────────────────────────┘ │     ProblemError   │
│              │                                       │     present       │
│              │  ┌─────────────────────────────────┐ │                   │
│              │  │           Sign In               │ │  ← Button w-full  │
│              │  └─────────────────────────────────┘ │                   │
│              │                                       │                   │
│              └───────────────────────────────────────┘                   │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Layout:
  - Outer: min-h-screen flex items-center justify-center bg-background p-4
  - Card: w-full max-w-md
```

### Reference: live mock

The current Login Card mock renders today via the theme-editor preview pane:

- **File**: `apps/dashboard/src/app/(dashboard)/theme-editor/cards-scene.tsx:24-54`
- **Live URL** (pre-#124 removal): `pnpm dev` → http://localhost:3000/theme-editor → first card in the preview grid
- **Verbatim mock** (paste reference for the extracted `LoginCard.tsx`):

```tsx
<Card>
  <CardHeader>
    <CardTitle>Login</CardTitle>
    <CardDescription>Sign in to your account</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-1.5">
      <Label className="text-sm">Email</Label>
      <div className="relative">
        <MailIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="you@example.com" className="pl-8" />
      </div>
    </div>
    <div className="space-y-1.5">
      <Label className="text-sm">Password</Label>
      <div className="relative">
        <LockIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="password" placeholder="••••••••" className="pl-8" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox />
      <Label className="text-sm">Remember me</Label>
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Sign In</Button>
  </CardFooter>
</Card>
```

Tokens to preserve when extracting:

- Card uses default `Card` ring + shadow-xs (no overrides) — matches `design-decisions.md` "Outer containers"
- Input icon: `absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground` + Input `pl-8` for the icon gutter
- Field stack: `space-y-1.5` between label + input; `space-y-4` between fields
- Submit button: full-width `Button` (default variant, default `h-9`)

The extraction adds: form `onSubmit`, controlled `value` / `onChange` for both inputs, `disabled` wiring on inputs + button, and the inline error region between checkbox and submit button (see `<Alert>` insertion point in the wireframe above).

### State variants

| State | Submit button | Error region | Inputs |
|---|---|---|---|
| **Default** | "Sign In" / enabled | hidden | enabled |
| **Loading** | `<Spinner className="size-4" />` + "Signing in…" / disabled | hidden | disabled |
| **Error** | "Sign In" / enabled | inline `<Alert variant="destructive">` showing `ProblemError.detail` | enabled (so user can retry) |
| **Locked** (4xx with title="Account locked") | "Sign In" / **disabled** | inline `<Alert variant="destructive">` showing detail + support link | disabled |

### Decision: inline error vs toast vs modal

**Inline.** Reasons:

1. The error happens in-context with the form fields the user just typed. Showing it next to those fields keeps cause and effect together.
2. Toast for an auth failure disappears too fast — users want to re-read it while correcting the password.
3. Modal is overkill and breaks the form's keyboard flow (focus jumps out, user has to tab back in).

The error block is wired to render only when `ProblemError` is non-null. Empty `detail` falls back to `"Sign in failed. Please check your email and password."` so users never see a blank red box.

### Loading button spec

```tsx
<Button className="w-full" disabled={isLoading}>
  {isLoading ? (
    <><Spinner className="size-4 mr-2" />Signing in…</>
  ) : (
    "Sign In"
  )}
</Button>
```

`Spinner` already has `role="status" aria-label="Loading"` so screen readers announce the loading state. The button stays focusable so keyboard users don't lose their place.

### Account-locked variant

If the BE returns `ProblemError { status: 423, title: "Account locked" }` (a future FE concern, not blocking #142), the Submit button moves to disabled and the error block adds a "Contact support" link. For now FE only needs to handle `400 / 401` — the locked path is documented for symmetry.

### `Remember me` semantics

Checked → refresh-token cookie issued with `maxAge` of 30 days. Unchecked → session cookie. This is a BE contract decision and the design only cares that the checkbox visually exists; the BE API contract tracks the actual behavior.

### Accessibility

- Form root: `<form onSubmit={...}>` so Enter from any field submits.
- Inputs have programmatically associated `<Label>` (already true in mock via `Label` adjacency — FE should add explicit `htmlFor` or wrap the input).
- Error region: `<Alert role="alert">` (Alert sets this) → screen readers announce on render.
- Focus order: Email → Password → Remember me → Sign In. Default focus to Email on mount.

---

## 2. `/error` (global 500 boundary)

### Replaces the current placeholder

The current `apps/dashboard/src/app/global-error.tsx` renders Next's default `<NextError statusCode={0} />`. That needs to be replaced with the `<ErrorState variant="full">` component.

### Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                                  ┌────┐                                  │
│                                  │ ⚠  │   ← XOctagonIcon, destructive   │
│                                  └────┘                                  │
│                                                                          │
│                       Something went wrong                               │
│                                                                          │
│            We hit an unexpected error. The team has been                 │
│            notified. You can try again, or head back home.               │
│                                                                          │
│                ┌─────────┐    ┌──────────────┐                           │
│                │  Retry  │    │  Go to home  │                           │
│                └─────────┘    └──────────────┘                           │
│                                                                          │
│                  ▸ Show technical details                                │
│                       (digest: a3f9e21b)                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component shape

```tsx
"use client";
import { ErrorState } from "@whitelabel/ui";

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <ErrorState
          error={error}
          variant="full"
          onRetry={reset}
          secondaryAction={{ label: "Go to home", href: "/" }}
        />
      </body>
    </html>
  );
}
```

### Why we still call Faro/Sentry here

`global-error.tsx` is the only page-level boundary that catches root-layout crashes. Whatever observability stack lands (Faro per #110), the report-on-mount call stays in this file (`useEffect` → `captureException`). The visual shell delegates to `<ErrorState>`; the side-effect stays local.

### Edge case: error during error

If `<ErrorState>` itself throws, Next.js falls back to its built-in error page. Acceptable — the user still gets *something*, and we've already reported via observability.

---

## 3. `/403` Forbidden

### When the user sees this

Authenticated user navigates to a route they don't have permission for. The middleware (#142) has confirmed they have a valid token, but the `RequirePermission` guard rejected them. Distinct from `/login`: they don't need to authenticate, they need different access.

### Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                                  ┌────┐                                  │
│                                  │ 🔒 │   ← LockIcon, default tone      │
│                                  └────┘                                  │
│                                                                          │
│                            Access denied                                 │
│                                                                          │
│            You don't have permission to view this page.                  │
│                                                                          │
│            ┌──────────────────────────────────────────┐                  │
│            │  Signed in as:    alice@example.com      │                  │
│            │  Required:        users.read             │                  │
│            └──────────────────────────────────────────┘                  │
│                                                                          │
│              ┌─────────────────┐    ┌──────────────┐                    │
│              │ Contact admin   │    │  Go to home  │                    │
│              └─────────────────┘    └──────────────┘                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Why show "Required: users.read"

Most permission errors in real organisations are administrative: the user needs to ask their admin for the missing role. Showing the exact permission string makes that conversation 10x faster ("can you add `users.read` to my role?" vs "I can't see users"). It is **not** a security risk: the permission name reveals nothing about the data, only the authorization model the user is already inside.

### "Contact admin" link

`mailto:` to the value of `NEXT_PUBLIC_SUPPORT_EMAIL` (env), or hidden if unset. Future iteration: link to an internal help-desk URL when one exists.

### Component shape

`<Forbidden />` lives in `apps/dashboard/src/components/auth/Forbidden.tsx` (per FE #142 file plan):

```tsx
<EmptyState
  icon={LockIcon}
  title="Access denied"
  description="You don't have permission to view this page."
>
  {/* extra block below description */}
  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
    <dt className="text-muted-foreground">Signed in as:</dt>
    <dd className="font-mono">{user.email}</dd>
    <dt className="text-muted-foreground">Required:</dt>
    <dd className="font-mono">{requiredPermission}</dd>
  </dl>
</EmptyState>
```

> Note: the `<EmptyState>` API in the sibling doc only takes `action`, not `children`. Either (a) extend `EmptyState` to accept `children` rendered after `description`, or (b) compose `Empty / EmptyHeader / EmptyTitle / EmptyDescription` directly in `Forbidden.tsx`. **Recommendation: (b)** — `<Forbidden>` is the only place that needs this pattern, so ad-hoc composition keeps `<EmptyState>` API surface minimal.

---

## 4. `/404` Not Found

### Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                                  ┌────┐                                  │
│                                  │ ❓ │   ← FileQuestionIcon            │
│                                  └────┘                                  │
│                                                                          │
│                          Page not found                                  │
│                                                                          │
│            We couldn't find what you were looking for.                   │
│            Check the URL, or head back home.                             │
│                                                                          │
│                       ┌──────────────┐                                   │
│                       │  Go to home  │                                   │
│                       └──────────────┘                                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component shape

```tsx
// apps/dashboard/src/app/not-found.tsx
import { FileQuestionIcon } from "lucide-react";
import { EmptyState } from "@whitelabel/ui";

export default function NotFound() {
  return (
    <EmptyState
      icon={FileQuestionIcon}
      title="Page not found"
      description="We couldn't find what you were looking for. Check the URL, or head back home."
      action={{ label: "Go to home", href: "/" }}
      fullPage
    />
  );
}
```

### Why no `Search` or "did you mean"

We don't have a search index in Phase 2. Adding one for a 404 page is scope creep. Once the search index exists (post-MVP), the 404 page gets a fuzzy-match suggestion block — that's a follow-up issue then, not a blocker now.

### Layout host

`/404` and `/403` are both **inside** the dashboard shell (sidebar visible) when reached via in-app navigation, but **outside** the shell when reached via direct URL while signed out. Implementation note for FE: place `not-found.tsx` at `apps/dashboard/src/app/not-found.tsx` (route-group root). The dashboard `(dashboard)/layout.tsx` only wraps routes inside that group, so the same `<NotFound>` component renders correctly both inside and outside the dashboard shell.

---

## Implementation order recommended for FE #142

1. **`<EmptyState>` and `<ErrorState>`** in `packages/ui/src/components/state/` — per sibling spec.
2. **Extract `LoginCard`** from `cards-scene.tsx` to `apps/dashboard/src/components/auth/LoginCard.tsx`. Add the inline error region and loading button per §1 above.
3. **`/login` page**: `apps/dashboard/src/app/login/page.tsx` mounts `<LoginCard>` centered on screen.
4. **`/404`**: drop in the spec from §4. Smallest possible footprint, ~10 lines.
5. **`/403`**: `Forbidden` component + wire `RequirePermission` to it.
6. **`/error`**: replace `global-error.tsx` body with `<ErrorState>` per §2.

Steps 1 and 2 unblock everything else. Steps 3–6 can run in parallel after that.

---

## Open questions for ARCH

1. **`NEXT_PUBLIC_SUPPORT_EMAIL`** — is there a designated address for "contact admin" yet? If not, FE should ship the env var hookup but render the link conditionally (hidden when unset). Default behavior in `.env.example`: leave blank.
2. **Account-locked status code** — confirmed `423 Locked`? FE only needs to wire it once the BE returns it, but knowing the code now lets the inline-error helper handle it from day one.
3. **`<EmptyState>` accepting `children`** — yes/no? My recommendation in §3 is to compose primitives in `Forbidden` directly; happy to defer to ARCH if there's a different opinion.

These are design-friction items, not blockers. FE #142 can ship the happy path with sensible defaults; we revise once ARCH answers.
