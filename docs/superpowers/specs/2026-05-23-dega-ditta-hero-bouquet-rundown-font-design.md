# Dega & Ditta — Hero / Bouquet / Rundown / Font Fixes Design Spec

**Date:** 2026-05-23
**Slug:** `/dega-ditta` (Floral Watercolor — Plum template)
**Scope:** Four follow-up visual fixes from a review pass.

## Goal

1. Hero: bring the candle/flower clusters in front of the couple illustration and
   stop them from covering the date/venue text.
2. Happy Couple: tilt the white bouquet to the left so it doesn't cover the faces.
3. Rundown: make the "Rundown" heading color match the other section headings.
4. Change the heading font from Imperial Script to Petit Formal Script.

## Change 1 — Hero: clusters in front, text uncovered

**File:** `apps/invitation/src/components/sections/HeroLight.tsx`

Today the two mirrored candle/flower clusters render behind the couple
(`z-0`, couple photo is `z-10`) and spill outward (`translateX(±32%)`, `w-[60%]`)
so on `md+` they overlap the date column ("26 JULY 2026") and venue column.

Fix:
- Raise the clusters **above** the couple photo (z-index greater than the
  couple's `z-10`) so the flowers/candles render in front.
- **Pull the clusters inward** — drop the outward `translateX(±32%)` (toward 0)
  and constrain width so they stay within the photo's footprint, framing the
  couple's lower-left/right corners in front instead of reaching into the
  side-text columns. The mirror (left cluster `scaleX(-1)`) stays.
- Tune z-index / horizontal inset / width live so the clusters sit low and frame
  the couple without obscuring the faces, and the date/venue text is fully clear.

## Change 2 — Happy Couple: tilt bouquet left

**File:** `apps/invitation/src/components/sections/Couple.tsx`

Add a left-leaning tilt (CSS `rotate`) to the bouquet image, composed with the
existing `scaleX(-1)` flip and lowered position, so the flowers angle outward to
the left and clear the couple's faces. The rotation angle is tuned live (the flip
inverts rotation direction, so the sign is confirmed visually).

## Change 3 — Rundown: heading color matches others

**File:** `apps/invitation/src/components/sections/Events.tsx`

The schedule heading `<h2>` (now "Rundown") has no explicit color, so it inherits
the section's taupe body color, unlike the other section headings. Add
`style={{ color: 'var(--wedding-accent, #ba6193)' }}` to the `<h2>` so it renders
in the plum accent, matching "Venue", "Dress Code", and the couple headings.

## Change 4 — Heading font → Petit Formal Script

**File:** `server/src/scripts/seed-floral-plum-template.ts`

`config.fontHeading: 'Imperial Script'` → `'Petit Formal Script'`. Petit Formal
Script is a Google font with a single weight (400); the invitation page's dynamic
font loader requests the heading font without a weight axis, so it loads as-is.
Applies to all `font-heading` text. Requires re-running the template seed.

## Files touched

- `apps/invitation/src/components/sections/HeroLight.tsx`
- `apps/invitation/src/components/sections/Couple.tsx`
- `apps/invitation/src/components/sections/Events.tsx`
- `server/src/scripts/seed-floral-plum-template.ts`

## Verification

1. `cd apps/invitation && npx tsc --noEmit` → no type errors.
2. Re-seed the template (for the font): `npx tsx server/src/scripts/seed-floral-plum-template.ts`.
3. Playwright at `http://localhost:3001/dega-ditta?to=wayan-sudana` (desktop +
   mobile):
   - Hero: clusters render in front of the couple; date and venue text fully
     visible, not overlapped.
   - Couple: bouquet tilts left, off the faces.
   - Rundown: heading is plum accent like the other headings.
   - All `font-heading` text renders in Petit Formal Script.
   - Tune cluster position/z (Change 1) and bouquet tilt angle (Change 2) live.

## Out of scope

- Other clients/templates (the font lives on the plum template, used only by
  dega-ditta; the hero/couple/rundown edits are gated on dega-ditta's data).
- Re-seeding the dega-ditta client (not needed; only the template font changed).
