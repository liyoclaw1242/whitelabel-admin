# Design Decisions

Canonical record of UI/UX choices for the whitelabel-admin dashboard. Future agents and contributors should read this before making visual changes to maintain consistency.

## Color System

- **Model**: OKLch for perceptual uniformity across light/dark modes
- **Palette**: Achromatic (neutral grays) by default — brand hue injected via theme presets
- **Card backgrounds**: `bg-card` for standard cards; `bg-muted/30` for stat/metric cards to add subtle depth without competing with content

## Borders & Shadows

- **Outer containers** (cards, panels, preset buttons): `ring-1 ring-foreground/[0.08]` — Schoger ring technique, never solid `border`
- **Card shadow**: `shadow-xs` paired with the ring to prevent the muddy border-meets-shadow artifact
- **Active/selected state**: `ring-2 ring-ring` — thicker ring, not color change on border
- **Hover state**: `ring-ring/60` — subtle ring color shift
- **Internal dividers** (card footer, header separator): `border-t` / `border-b` is acceptable inside a container since the outer ring handles the perimeter

## Typography

- **Eyebrow labels**: `text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono` — used above page titles and as stat card labels
- **Page headings**: `text-2xl font-bold -tracking-[0.02em]` — tight negative tracking on headlines
- **Body/description text**: `text-sm text-muted-foreground max-w-[60ch]` — ch-unit max-width for readability
- **Font stack**: Geist Sans via `--font-sans`; monospace via system `font-mono`

## Layout

- **Page structure**: eyebrow > heading > description, left-aligned (not centered)
- **Spacing**: `space-y-8` between page sections (not `space-y-6` — more breathing room)
- **Stat grid**: uniform 4-col on lg, 2-col on sm — each card has icon in top-right for visual interest

## Buttons

- **Default height**: `h-9` (36px) — meets 36-38px touch target guideline
- **Shape**: `rounded-lg` (inherits from radius token system)
- **Padding**: `px-3` for comfortable text spacing

## Components

- **Stat cards**: `StatCard` component pattern — eyebrow label, large value, change indicator, icon top-right
- **Placeholder panels**: `rounded-xl bg-muted/30 ring-1 ring-foreground/10` — consistent with card treatment
- **Preset selector cards**: ring border, subtle bg, concentric radius (`rounded-xl` outer, `rounded-sm` inner swatches)
- **Color swatches**: `ring-1 ring-foreground/10` instead of solid border

## Accessibility

- All icon-only buttons have `aria-label`
- Search input has `type="search"` for native affordances
- Color contrast follows OKLch lightness values (foreground L:0.145 on background L:1.0 = high contrast)
- Focus rings: `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`
