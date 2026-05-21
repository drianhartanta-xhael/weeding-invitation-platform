# Design — dega-ditta TRT illustration refresh

**Date:** 2026-05-21
**Branch:** `feat/floral-watercolor-template`
**Status:** Approved

## Summary

Refresh four sections of the `/dega-ditta` invitation to match the couple's latest
Canva references, using the watercolor illustration pack in `dega-dita-asets2/TRT/`:
Cover (envelope), Hero (couple over a candle/floral arrangement), Mempelai (single
center photo flanked by names + bouquet + rings), and Venue (stage-illustration
background behind the embedded map). All other sections stay as they are.

Every change is **gated to dega-ditta** — driven by per-section `data` fields (which are
Mongoose `Mixed`, so no model changes) and the existing `heroVariant: 'light'` template
flag. `/dega-lauditta` and all other clients keep their current rendering.

## Goals

- Match the four reference designs for the evening preview.
- Zero regression to `/dega-lauditta` (shared components gain opt-in branches only).
- No Mongoose model changes (reuse Mixed section `data` and the existing `heroAccent`
  slot on `customContent`).

## Non-goals

- No changes to Gallery, Events, Dress Code, RSVP, Wishes, Gift, or Footer ("keep the
  rest the same for now").
- The remaining TRT motifs (tea set, vows cards, food/dinner, cocktails, champagne
  toast, fireworks, instruments, strawberry cake) are not wired in yet — available for
  a later pass.

## Assets

Copy from `dega-dita-asets2/TRT/` into `apps/invitation/public/assets/dega-ditta/`:

| Source | Destination | Use |
| --- | --- | --- |
| `Untitled design (1).png` | `envelope.png` | Cover envelope + daisies |
| `IMG_2282.PNG` | `hero-decor.png` | Hero candle/floral base |
| `IMG_2280.PNG` | `bouquet.png` | Mempelai bouquet (left of photo) |
| `IMG_2287.PNG` | `couple-rings.png` | Mempelai silver rings (bottom-right of photo) |
| `IMG_2289.PNG` | `venue-bg.png` | Venue section background (clean, no text) |

## Section changes

### 1. Cover — `apps/invitation/src/components/Cover.tsx`

Add an illustration variant, selected when the cover section provides a `coverImage`.
Layout (cream bg, Img #3):

- top: invite line, e.g. "You are cordially invited to celebrate the day of"
  (mauve, `--wedding-accent`)
- `groomName` + " and " + `brideName` in the heading font (mauve script)
- the `coverImage` (`envelope.png`)
- bottom: open line, e.g. "Click to open the invitation." (mauve)
- a subtle "Kepada Yth. {guestName}" below it (keeps `?to=` personalization)

New optional props: `coverImage?`, `inviteText?`, `openText?`. When `coverImage` is
absent, render the existing heart/envelope CSS cover unchanged (dega-lauditta path).
Colors come from the template presets already passed in (`bg`, `accent`, `textColor`).

The page (`[slug]/page.tsx`) passes `coverImage={coverSection.data.coverImage}`,
`inviteText={coverSection.data.inviteText}`, `openText={coverSection.data.openText}`.

### 2. Hero — `apps/invitation/src/components/sections/HeroLight.tsx`

- Remove the rings crest at the top.
- Add a `baseImage` prop (the candle/floral arrangement). Render it at the base of the
  center couple illustration: a relative wrapper with `baseImage` absolutely positioned
  bottom-center (slightly wider than the photo, lower z-index) and the couple photo in
  front, so it frames the lower half like Img #4.
- Names, 3-column date/venue, flourishes, guest line, and scroll button stay.

The page passes `baseImage={cc?.heroAccent}` (the `heroAccent` `customContent` field is
repurposed from the old rings crest to the hero base image — no new model field).

### 3. Mempelai — `apps/invitation/src/components/sections/Couple.tsx`

Add a `layout: 'split'` mode (default = the existing two-photo layout, so dega-lauditta
is unchanged). Split layout (Img #5):

- heading (script): `data.heading` → "The happy couple and parents"
- center: circular `data.centerPhoto` (`2.jpg`); `data.bouquetImage` (`bouquet.png`)
  overlapping the left edge; `data.ringsImage` (`couple-rings.png`) overlapping the
  bottom-right.
- groom block: `groomName` (script "Dega Aprillian"), `data.groomLabel` ("First son of"),
  then `groomParents.father` ("Akhmad Taufikh (alm.)") / "and" / `groomParents.mother`
  ("Sri Muji Astuti").
- bride block: `brideName` (script "Lauditta Soraya Librata"), `data.brideLabel`
  ("First daughter of"), then `brideParents.father` ("Johan Librata (alm.)") / "and" /
  `brideParents.mother` ("Nina Krisnawati").
- Responsive: desktop `grid md:grid-cols-3` = groom | photo | bride; mobile stacks
  photo → groom → bride (photo first via `order-first md:order-none`).

`SectionRenderer` passes the extra `data` fields (`layout`, `heading`, `centerPhoto`,
`bouquetImage`, `ringsImage`, `groomLabel`, `brideLabel`) to `Couple`.

### 4. Venue — `apps/invitation/src/components/sections/LocationMap.tsx`

Add a `backgroundImage` variant (selected when `data.backgroundImage` is set):

- `venue-bg.png` as the section background (the stage watercolor), e.g. centered,
  `background-size: contain`, no-repeat, behind the content.
- **Keep the embedded Google Map iframe** (the existing map card stays on top of the
  illustration). [Corrected from the first proposal — the iframe is retained.]
- in the background variant the script `<h2>` shows `data.heading` ("Venue"), with the
  venue name ("Hilton Garden Inn Bali Nusa Dua") as a line below it. In the default
  (non-bg) variant the header is unchanged ("Lokasi" label + `venue` as the h2).
- the maps button stays (label from `data.buttonLabel`, e.g. "GOOGLE MAPS"), opening
  `mapUrl`.
- drop the car accent for this section.

Suppress the floral band decoration on this section so the illustration reads cleanly:
`SectionRenderer` skips `SectionDecor` when `section.data.noDecor` is truthy.

New optional `LocationMap` props: `backgroundImage?`, `heading?`, `buttonLabel?`.

### Wiring summary

- `SectionRenderer.tsx`: pass new `couple-profile` fields; pass `backgroundImage`,
  `heading`, `buttonLabel` to `LocationMap`; honor `noDecor` (skip `SectionDecor`).
- `[slug]/page.tsx`: pass `coverImage`/`inviteText`/`openText` to `Cover`;
  `baseImage={cc?.heroAccent}` to `HeroLight`.
- `seed-dega-ditta.ts`: copy/reference new asset paths; set `heroAccent` to
  `hero-decor.png`; update couple section to `layout:'split'` with the new photo,
  bouquet, rings, labels, and updated parent names; set location section
  `backgroundImage`, `noDecor`, button label, and remove `accentImage`; add cover
  section `coverImage`/`inviteText`/`openText`.

## Data flow (unchanged)

Browser → `[slug]/page.tsx` fetches the invitation → template `config.heroVariant` and
section `data` drive the variant branches in Cover / HeroLight / Couple / LocationMap.
Section `data` is `Mixed`, so the new keys persist without schema edits.

## Error handling

Additive, backward-compatible branches. Missing `coverImage` → default heart cover;
missing `baseImage` → hero without base art; `layout !== 'split'` → existing couple
layout; missing `backgroundImage` → existing map section. Seeds are idempotent upserts.

## Verification

1. `npm run lint` (type-check gate) + `cd server && npx tsc --noEmit`.
2. Copy assets; re-run `npx tsx server/src/scripts/seed-dega-ditta.ts`.
3. Browser (mobile + desktop): Cover envelope, Hero with candle/floral base, Mempelai
   split with center photo + bouquet + rings, Venue with illustration bg + iframe + button.
4. Regression: `/dega-lauditta` unchanged (heart cover, two-photo couple, normal map,
   floral bands present).

## Out of scope / follow-ups

- Wiring the remaining TRT motifs into Events / Dress Code / etc.
- Any reordering of sections.
