# Theme Editor — Scope Decision

> **Status**: Decision recommended — pending ARCH sign-off
> **Parent**: #110 Phase 0 / #124 DESIGN task
> **Author**: `design-20260414-1014218`
> **Date**: 2026-04-16

## Context

The current Theme Editor is a single-route feature under `/theme-editor` that lets a user pick one of 42 preset colour palettes and tweak 52 design tokens in real time.

### Current footprint

| File | Lines | Notes |
|------|------:|-------|
| `packages/ui/src/lib/theme-presets.ts` | **5,177** | 42 `ThemePreset` objects × `light` + `dark` × 52 `ColorTokens` fields. ~160 KB of source. |
| `apps/dashboard/src/app/(dashboard)/theme-editor/page.tsx` | 1,855 | Main editor shell. Imports ~60 primitives from `@whitelabel/ui`. |
| `apps/dashboard/src/app/(dashboard)/theme-editor/dashboard-scene.tsx` | 200 | Live-preview scene. |
| `apps/dashboard/src/app/(dashboard)/theme-editor/cards-scene.tsx` | 140 | Live-preview scene. |
| `apps/dashboard/src/app/(dashboard)/layout.tsx` | (row 55) | Sidebar nav entry → `PaletteIcon` / `/theme-editor`. |
| `packages/ui/src/index.ts` | (rows 16–17) | Public re-export: `tweakcnPresets`, `tweakcnPresetMap`, `ThemePreset`. |

### Consumers

- **Only consumer**: the Theme Editor page itself.
- No other feature in `apps/dashboard` imports `tweakcnPresets` or `theme-presets`. `grep -r tweakcnPresets apps` returns nothing outside the editor route.
- `ThemeProvider` (in `@whitelabel/ui`) does **not** depend on `theme-presets` at runtime; it only needs `ColorTokens` + a default theme, which live elsewhere.

### Relationship to Phase 2

From #110 (Phase 0 checklist) and #109 (refactor epic):

- Phase 2 is the **MVP login-flow rewrite** (Auth + Users + Items + Tenants).
- Theme Editor is **not** on the Phase 2 user-facing critical path.
- The 5,177-line preset file is flagged as a Phase 0 blocker because it forces a binary choice before FE can plan code-splitting and bundle budgets for Phase 2.

---

## Options

### Option A — Keep as-is

Ship the current editor + all 42 presets, leave it in the sidebar, treat it as a first-class admin feature. Add lazy-load + route code-split as a follow-up so the preset blob does not inflate the top-level bundle.

| Dimension | Assessment |
|---|---|
| **User value** | Medium. Lets tenants preview brand colours end-to-end without writing Tailwind config. But no evidence (issues / telemetry) that whitelabel customers have asked for a 42-preset picker — more likely 2-4 brand presets are enough. |
| **Maintenance cost** | High. Every new design token (we added ~12 since the tokens list was frozen) must be backfilled into 42 × 2 = **84 colour maps**, or presets silently regress. |
| **Bundle impact** | **~160 KB** source / ~40 KB min-gzip on the `/theme-editor` chunk. Mitigated by route code-split — Next.js App Router already gives per-route splitting, so the main shell is not affected **if** `tweakcnPresets` is never imported from a globally-loaded module. Risk: one stray `import { tweakcnPresets }` in a layout component leaks the blob into every route. |
| **Recovery difficulty** | Trivial — no-op, code already exists. |
| **Phase 2 friction** | High. FE must (a) verify no global import leaks the preset blob, (b) add a lazy boundary, (c) keep the tokens list in sync when Phase 2 adds new semantic tokens (likely). Each of those is a separate sub-task. |

### Option B — Hide (feature flag / unlisted route)

Remove the sidebar link, keep the code on disk, keep the route reachable only via direct URL (`/theme-editor`) or a `NEXT_PUBLIC_ENABLE_THEME_EDITOR` flag. Dead weight in the repo but zero risk to Phase 2 users.

| Dimension | Assessment |
|---|---|
| **User value** | Low-to-none for end users. Developer-only escape hatch for quick palette previews during Phase 2 UI work. |
| **Maintenance cost** | Medium. Code still compiles → still must be kept green when UI primitives change. Tokens list drift is still possible but lower stakes (no users see it). |
| **Bundle impact** | **Near-zero on production bundle** if the route is gated behind a build-time flag (`process.env.NEXT_PUBLIC_ENABLE_THEME_EDITOR !== "true"` → tree-shaken). At runtime: same ~40 KB gzip cost but only paid by the developer who loads the hidden URL. |
| **Recovery difficulty** | Trivial — flip the flag / re-add the sidebar entry. |
| **Phase 2 friction** | Low. Removes the "does my global import leak the blob" audit entirely if the feature flag gates the page component. |

### Option C — Remove

Delete the `/theme-editor` route, delete `theme-presets.ts`, remove `tweakcnPresets` / `tweakcnPresetMap` / `ThemePreset` from the `@whitelabel/ui` public surface, drop the sidebar entry. Keep only the runtime `ThemeProvider` + `ColorTokens` type (which live outside the preset file).

| Dimension | Assessment |
|---|---|
| **User value** | None lost that we can point to — no external user has asked for it, and the 2–4 brand themes a real customer needs can be hand-authored in `defaultLightTheme` / `defaultDarkTheme` (already separate files). |
| **Maintenance cost** | **Zero ongoing.** -5,177 lines from `packages/ui`, -2,195 lines from `apps/dashboard`. `pnpm --filter @whitelabel/ui typecheck` stops carrying the 42-preset tokens-list constraint. |
| **Bundle impact** | **-160 KB** source / **~-40 KB gzip** on whatever route referenced it (today: one route; tomorrow: potentially any route if a global leak appears). Also removes the 52-field `ColorTokens` coupling that made Phase 2 token additions expensive. |
| **Recovery difficulty** | **Medium**. Restoring the file itself is `git revert` — cheap. Restoring the *page component* + its 60 UI-primitive wiring is less cheap but still bounded (~1 day of FE work). Given the file is version-controlled, "removed" ≠ "lost". |
| **Phase 2 friction** | **Lowest.** Nothing to audit, nothing to split, nothing to keep in sync. Phase 2 can add / rename design tokens freely without an 84-map backfill. |

---

## Comparison table

| Dimension | A — Keep | B — Hide | C — Remove |
|---|---|---|---|
| User value today | Medium (speculative) | Low | None documented |
| Maintenance cost | High (84 colour-map backfills on token changes) | Medium (compiles, doesn't ship) | **Zero** |
| Bundle impact (worst case) | +40 KB gzip on any route that accidentally imports it | +40 KB gzip only on hidden URL | **0 KB** |
| Recovery difficulty | n/a | Flip flag | `git revert` + ~1 day FE |
| Phase 2 blocker | Yes — needs lazy-boundary audit + tokens-list sync contract | No | **No** |
| Reversibility | Trivial | Trivial | Medium |

---

## Recommendation

### **Option C — Remove.**

**Verdict: APPROVED — Option C**

### Why

1. **Phase 2 friction is the deciding factor** (per #110's framing). C removes the blocker entirely; A keeps two separate follow-up workstreams (lazy-boundary audit + tokens-list sync) on the critical path; B removes the audit but keeps the sync liability.
2. **No user demand has been recorded.** The feature was built on spec, not request. Removing un-requested features during a refactor is how the refactor stays on schedule.
3. **The cost is recoverable.** Git keeps the file; any customer who later asks for 42-preset picker gets it back with a `git revert` + one FE sprint. That is a cheap future option to buy with "delete now".
4. **The 5,177-line token coupling is the real tax.** Every new semantic token Phase 2 introduces (likely: auth-specific states, empty-state colours) would otherwise require editing 84 colour maps. That tax compounds; deleting the file stops the meter.

### Why not B

B keeps the code debt without the upside. If we believe there's a future demand, we should keep it visible (A). If we don't, hiding it just pushes the "should we remove this?" conversation six months out, during which the tokens list drifts further out of sync with the 42 presets.

### Implementation scope (for ARCH to hand to FE)

If ARCH approves Option C, the FE task is:

1. Delete `apps/dashboard/src/app/(dashboard)/theme-editor/` (entire directory).
2. Remove the `PaletteIcon` / `"Theme Editor"` sidebar nav entry in `apps/dashboard/src/app/(dashboard)/layout.tsx` line 55.
3. Delete `packages/ui/src/lib/theme-presets.ts`.
4. Remove the three re-exports in `packages/ui/src/index.ts` lines 16–17 (`tweakcnPresets`, `tweakcnPresetMap`, `ThemePreset`).
5. Verify `pnpm --filter @whitelabel/ui typecheck` and `pnpm build` are green.
6. Confirm no orphan imports via `grep -r tweakcnPresets . --exclude-dir=node_modules --exclude-dir=.next`.

Keep: `ThemeProvider`, `ColorTokens` type, `defaultTheme` / `defaultLightTheme` / `defaultDarkTheme`. These are unrelated to `theme-presets.ts` and are still used by the dashboard shell.

### If ARCH disagrees

If product insists on preserving tenant-facing theming, Option B is the safe fallback — it buys time without paying the bundle tax, and the decision can be revisited at the end of Phase 2 with real usage data.

---

## References

- `packages/ui/src/lib/theme-presets.ts` (5,177 lines)
- `apps/dashboard/src/app/(dashboard)/theme-editor/page.tsx` (1,855 lines)
- `apps/dashboard/src/app/(dashboard)/layout.tsx:55` (sidebar nav)
- `packages/ui/src/index.ts:16–17` (public re-exports)
- Parent issue: #110 (Phase 0 checklist, "Theme editor 最終範圍")
- Epic: #109 (refactor)
