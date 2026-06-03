# Invitation Loading Skeleton — Design

**Date:** 2026-06-03
**Status:** Approved
**Scope:** `apps/invitation`

## Problem

The public invitation page (`apps/invitation/src/app/[slug]/page.tsx`) is a client
component (`'use client'`) that fetches invitation data via axios inside `useEffect`,
*after* hydration. While the request is in flight, the page renders a bare black div:

```tsx
if (loading) {
  // No spinner — render a dark blank page so the Cover overlay slides in seamlessly.
  return <div className="min-h-screen bg-black" />;
}
```

On Vercel with a slow network, that black screen is the only thing a visitor sees
until the API round-trip completes — often several seconds. It reads as broken/blank.

This change replaces the blank with a branded shimmer skeleton. It fixes the
**perceived** blank; it does not change actual fetch time.

## Constraints

- The template's colors arrive **with** the API response, so they are unavailable
  while loading. The skeleton must choose a palette up front.
- **Decision:** hardcode dega-ditta's palette — plum background `#6B1020`, gold
  accent `#C8A84B`. dega-ditta matches perfectly; a hypothetical non-plum wedding
  would briefly flash plum before its real theme loads. Accepted trade-off; the
  component can be parameterized later if other templates need it.
- The background must stay dark/plum (not switch to light) so the existing Cover
  overlay continues to fade in seamlessly — matching the intent of the current
  `bg-black` comment.

## Design

### Component: `LoadingSkeleton.tsx` (new)

Location: `apps/invitation/src/components/LoadingSkeleton.tsx`. Client component.

Full-screen plum background with centered placeholder blocks that mirror
dega-ditta's cover layout (the `coverImage` variant of `Cover.tsx`):

```
┌────────────────────────┐
│       (plum bg)        │
│   ▓▓▓▓▓▓  ← invite line │
│  ▓▓▓▓▓▓▓▓▓▓▓ ← names    │
│   ┌──────────┐         │
│   │ ▓▓▓▓▓▓▓▓ │ ← envelope block
│   └──────────┘         │
│     ▓▓▓▓  ← "open" line │
└────────────────────────┘
```

Placeholder blocks are translucent gold (`#C8A84B` at low opacity) with an animated
**CSS shimmer sweep** (a moving linear-gradient). No animation library is required
(Framer Motion is available but unnecessary here; a CSS keyframe is lighter).

### Anti-flash behavior

- The plum background paints immediately.
- The shimmer blocks fade in only after ~150ms (e.g. a `useEffect` + state flag, or a
  CSS `animation-delay` on opacity).
- Result:
  - **Fast load:** plum → Cover overlay. No shimmer flash.
  - **Slow load:** plum → shimmer → Cover overlay.

### Integration

In `page.tsx`, replace the loading branch:

```tsx
if (loading) {
  return <LoadingSkeleton />;
}
```

`LoadingSkeleton` owns the plum background, so the seamless-cover intent is preserved.

### Shimmer keyframes

Add a `shimmer` keyframe to `apps/invitation/src/app/globals.css` (or scope it inside
the component). The sweep animates a gradient's background-position across each block.

### Error state

Unchanged. The existing "Invitation Not Found" panel (`page.tsx`, error branch) stays.

## Out of scope

- Refactoring the page to a server component / Suspense + `loading.tsx`. That is the
  "correct" long-term fix (it would let real content stream and shrink actual load
  time), but it is a large, risky change given the page's heavy use of client hooks
  (`useState`, Framer Motion, runtime theme/font injection). Not done here.
- Per-template skeleton palettes. Hardcoded plum for now.

## Files touched

- **NEW** `apps/invitation/src/components/LoadingSkeleton.tsx`
- **EDIT** `apps/invitation/src/app/[slug]/page.tsx` — loading branch (lines ~172–175)
- **EDIT** `apps/invitation/src/app/globals.css` — `shimmer` keyframes (or inline in component)

## Verification

- `npx tsc --noEmit` in `apps/invitation` passes.
- Manual: throttle network in DevTools, load `/dega-ditta` — see plum + gold shimmer
  instead of black, transitioning seamlessly into the Cover overlay.
