# Dega & Ditta — Divider / Cake / Bouquet Refinement Design Spec

**Date:** 2026-05-23
**Slug:** `/dega-ditta` (Floral Watercolor — Plum template)
**Scope:** Three follow-up visual refinements after the seed refresh, plus the
small shared-component changes needed to deliver them.

## Goal

Make three dega-ditta visuals look intentional and tidy:
1. The bunga section divider should sit cleanly at the bottom-center of each
   section, blend in, and clearly mark the end of the section.
2. The white bouquet in the Happy Couple section should sit lower so it no longer
   covers the couple photo.
3. The rundown cake image should look tidy and prominent (currently small and
   floating in empty space).

## Root cause

All three TRT illustrations sit on large transparent canvases, so the visible art
floats inside a much bigger box:
- `cake.png` and `bouquet.png`: 2913×4134 (0.70:1 portrait), art in the middle.
- `bunga.png`: 1772×1772 square, meadow in a center horizontal band.

The shared fix is to **trim the transparent margins** of these PNGs (one-off
Node + `sharp` `.trim()` script — `sharp` resolves from the repo root
`node_modules`), then adjust how each renders.

**No seed changes are required.** Every image path stays the same; this work is
trimmed asset files + component/decoration code only. Re-seeding is not needed.

## Change 1 — Section divider: in-flow, blended, marks section end

**Files:**
- `apps/invitation/public/assets/dega-ditta/bunga.png` (trimmed in place)
- `apps/invitation/src/lib/decorations/types.ts`
- `apps/invitation/src/lib/decorations/floral-plum/index.tsx`
- `apps/invitation/src/lib/decorations/registry.ts`
- `apps/invitation/src/components/SectionRenderer.tsx`

Approach (chosen: **in-flow at section end**):
- Trim `bunga.png` to a tight wildflower band.
- Add an optional slot to `DecorationConfig`:
  `SectionDivider?: FC<DecorProps>`. Optional → no other decoration entries change.
- floral-plum:
  - `SectionDecor` stops drawing the top/bottom overlay bands (renders nothing).
  - New `SectionDivider` renders the trimmed bunga **centered, in normal flow**,
    with a soft left/right fade mask (`linear-gradient` mask) so the edges blend,
    a constrained width (`min(320px, 70%)`), and bottom spacing.
- `registry.ts`: add `SectionDivider: FloralPlumSectionDivider` to the
  `floral-plum` entry (import it).
- `SectionRenderer.tsx`: render `decorConfig.SectionDivider` in normal flow
  **after** each section's content (inside the existing `z-1` wrapper), gated by
  `decorConfig.SectionDivider && !section.data?.noDecor`.

Because the divider is in-flow it reserves its own vertical space — it never
overlaps content, and visually caps the bottom of each section. Sections marked
`noDecor` (e.g. `location-map`) get no divider, as today.

## Change 2 — Rundown cake: trim + enlarge

**Files:**
- `apps/invitation/public/assets/dega-ditta/cake.png` (trimmed in place)
- `apps/invitation/src/components/sections/Events.tsx`

- Trim `cake.png` to its tight bounding box, removing the floating empty space.
- In `Events.tsx`, enlarge the per-event image from `w-24` to roughly
  `w-44 sm:w-52` (final value tuned live). Only dega-ditta sets an event `image`
  (verified across all seed scripts), so this is effectively scoped to it.

## Change 3 — White bouquet: lower, off the photo

**Files:**
- `apps/invitation/public/assets/dega-ditta/bouquet.png` (trimmed in place)
- `apps/invitation/src/components/sections/Couple.tsx`

- Trim `bouquet.png` to its tight bbox so its position maps predictably to the
  visible flowers.
- In `Couple.tsx` (split layout), push the bouquet lower (e.g. `-bottom-6` →
  ~`-bottom-14`) and nudge it left so the flowers clear the circular photo;
  keep the existing horizontal flip (`scaleX(-1)`). Re-balance the bouquet width
  against the (untrimmed) rings. Final offsets/width tuned live via Playwright.
- The rings (`couple-rings.png`) stay untrimmed unless the pairing looks
  unbalanced after the bouquet trim.

## Trimming script

A one-off Node + `sharp` script trims the three assets:
- `cake.png`  ← trim from `dega-dita-asets2/TRT/IMG_2288.PNG`
- `bunga.png` ← trim from `dega-dita-asets2/TRT/bunga.png`
- `bouquet.png` ← trim from the current public `bouquet.png` (git preserves the
  pre-trim original)

`sharp(input).trim().toPng().toFile(output)` trims borders matching the
transparent top-left corner. Outputs overwrite the public asset files.

## Files touched

Trimmed assets (in place):
- `apps/invitation/public/assets/dega-ditta/bunga.png`
- `apps/invitation/public/assets/dega-ditta/cake.png`
- `apps/invitation/public/assets/dega-ditta/bouquet.png`

Code:
- `apps/invitation/src/lib/decorations/types.ts`
- `apps/invitation/src/lib/decorations/floral-plum/index.tsx`
- `apps/invitation/src/lib/decorations/registry.ts`
- `apps/invitation/src/components/SectionRenderer.tsx`
- `apps/invitation/src/components/sections/Events.tsx`
- `apps/invitation/src/components/sections/Couple.tsx`
- One-off trim script (e.g. `scripts/trim-dega-ditta-assets.mjs`)

## Verification

1. Run the trim script; confirm the three assets shrink to tight bounding boxes.
2. `cd apps/invitation && npx tsc --noEmit` → no type errors.
3. With the dev servers running, drive Playwright at
   `http://localhost:3001/dega-ditta?to=wayan-sudana`:
   - Section divider sits centered at the bottom of each section, blended, with
     clear spacing, not overlapping content.
   - Rundown cake is tidy and prominent, no floating empty space.
   - Bouquet sits lower, flowers clear of the photo, balanced with the rings.
   - Tune divider width/fade, cake size, and bouquet offsets to taste.
4. No re-seed required.

## Out of scope

- Seed/data changes (none needed).
- Other clients/templates (the `SectionDivider` slot is optional; only the
  floral-plum decoration and dega-ditta's event image are affected).
- Trimming the rings image (only if the bouquet pairing looks unbalanced).
