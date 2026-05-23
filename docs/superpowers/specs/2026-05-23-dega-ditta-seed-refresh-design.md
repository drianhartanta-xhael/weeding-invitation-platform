# Dega & Ditta Seed Refresh — Design Spec

**Date:** 2026-05-23
**Slug:** `/dega-ditta` (Floral Watercolor — Plum template)
**Scope:** Ten requested changes to the dega-ditta invitation, plus the minimal
shared-component refactors needed to deliver them cleanly.

## Goal

Apply ten content/visual changes to the `/dega-ditta` invitation without
regressing other clients (nusantara region templates, dega-lauditta, budi-sari)
that share the same components.

## Guiding principle

Many of these changes touch **shared** components (`Events`, `Wishes`,
`Footer`, `Couple`, `HeroLight`, `LocationMap`, `Cover`). Rather than hardcode
dega-ditta's wording/visuals into those components, we make the relevant text
and visuals **data-driven props, with the current values kept as defaults** —
the same pattern `RSVP` and `Gift` already use for their `text` prop. Pure value
changes live in the seed scripts. Net effect: dega-ditta changes are expressed
in `seed-dega-ditta.ts`, and other clients render identically to before.

No new image assets are required — every change reuses files already in
`apps/invitation/public/assets/dega-ditta/`. The untracked `dega-dita-asets2/`
folder at the repo root is **out of scope** for this work.

## Change-by-change

### 1. Heading font → Imperial Script
- **File:** `server/src/scripts/seed-floral-plum-template.ts`
- `config.fontHeading: 'Pinyon Script'` → `'Imperial Script'`.
- The invitation page (`[slug]/page.tsx`) loads the heading font from
  `config.fontHeading` and sets `--font-heading`. Its Google-Fonts URL appends
  the `:wght@300;400;700` axis only to the **last** family (the body font), so
  the heading font is requested at its default weight (400). Imperial Script
  ships weight 400 only, so the existing loader handles it without change.
- Applies site-wide to all `font-heading` text (hero/cover names, section
  headings).

### 2. Hero candle+flowers → two clusters at bottom-left / bottom-right
- **File:** `apps/invitation/src/components/sections/HeroLight.tsx`
- Today a single `baseImage` (`hero-decor.png`, the candle/flower composite)
  sits centered behind the couple (`bottom-[-20%] w-[135%]`).
- Replace it with **two copies of the same image**, scaled down, anchored to the
  bottom corners of the couple-photo container and layered behind the couple
  (`z-0`): bottom-right rendered normally, bottom-left rendered with
  `transform: scaleX(-1)`. This frames the couple the way the bouquet/rings
  frame the photo in the Happy Couple section.
- **Chosen approach:** mirror one image on both sides (no asset prep). Both
  clusters are mirror copies of the same composite.
- Behaviour gated on `baseImage` being present, so clients that don't pass a
  hero accent are unaffected.
- Starting values (to be tuned by running the page): each cluster ~50–60% of the
  couple container width, anchored at the bottom corners, slight outward offset.

### 3. Remove "Nusantara Wedding" label (plum / dega-ditta only)
- **Files:** `apps/invitation/src/components/sections/Footer.tsx`,
  `server/src/scripts/seed-floral-plum-template.ts`
- Currently: `{regionLabel || 'Nusantara Wedding'}`.
- Scope decision: change is **limited to the plum template** (used only by
  dega-ditta). Other demo templates (mvp/budi-sari, floral) keep showing
  "Nusantara Wedding" exactly as today.
- Mechanism: Footer treats an **explicit empty string** as "hide" while keeping
  the fallback for `undefined`:
  ```
  const label = regionLabel === undefined ? 'Nusantara Wedding' : regionLabel;
  // render the eyebrow <p> only when `label` is a non-empty string
  ```
  Then set `config.regionLabel: ''` on the plum template seed.
- Result: plum (`''`) → hidden; mvp/floral (`undefined`) → still
  "Nusantara Wedding"; region templates (`'Jakarta · Betawi'`, etc., set in
  `seed-regions.ts`) → unchanged.

### 4. Wishes section → English
- **Files:** `apps/invitation/src/components/sections/Wishes.tsx`,
  `apps/invitation/src/components/SectionRenderer.tsx`,
  `server/src/scripts/seed-dega-ditta.ts`
- Add an optional `text` prop to `Wishes` (mirroring `RSVP`/`Gift`), with the
  current Indonesian strings as defaults:
  - eyebrow (`Pesan & Doa`), title (`Ucapan & Doa`)
  - name placeholder (`Nama Anda`), message placeholder
    (`Tulis ucapan dan doa Anda...`)
  - submit (`Kirim Ucapan 🌸`), sending (`Mengirim...`)
  - date locale (`id-ID`)
- `SectionRenderer` passes `text={section.data.text}` to `Wishes`.
- Seed sets English values, e.g. eyebrow `Wishes & Prayers`, title
  `Send Your Wishes`, name `Your name`, message
  `Write your wishes and prayers...`, submit `Send Wish 🌸`,
  sending `Sending...`, locale `en-US`.

### 5. Schedule → "Rundown", English, drop "Hari Istimewa"
- **Files:** `apps/invitation/src/components/sections/Events.tsx`,
  `apps/invitation/src/components/SectionRenderer.tsx`,
  `server/src/scripts/seed-dega-ditta.ts`
- Add optional props to `Events`, defaulting to current Indonesian values:
  - `eyebrow` (default `Rangkaian Acara`) — render only when non-empty.
  - `heading` (default `Hari Istimewa`).
  - row labels: `Tanggal`/`Waktu`/`Tempat`, map button `Lihat Peta`.
  - date locale (`id-ID`).
- `SectionRenderer` passes these from `section.data`.
- Seed sets: `heading: 'Rundown'`, `eyebrow: ''` (hidden), labels
  Date/Time/Venue, map button `View Map`, locale `en-US`.
- The heading renders in `font-heading` (now Imperial Script per change #1).

### 6. Enlarge bouquet & rings in Happy Couple
- **File:** `apps/invitation/src/components/sections/Couple.tsx` (split layout)
- Bouquet `w-24 sm:w-32` → ~`w-36 sm:w-44`; rings `w-20 sm:w-24` →
  ~`w-28 sm:w-32` (≈2 size steps up). Adjust the `-left`/`-right`/`-bottom`
  offsets so the larger art still anchors to the photo without clipping.
- Only fires when `bouquetImage`/`ringsImage` are set = dega-ditta only.

### 7. Change song
- **File:** `server/src/scripts/seed-dega-ditta.ts`
- `music.videoId: 'dt25SFw8H4Y'` → `'DBoaOnj6Ll4'`
  (from `https://youtu.be/DBoaOnj6Ll4`). `autoplay` stays `true`.

### 8. Dress-code text
- **File:** `server/src/scripts/seed-dega-ditta.ts`
- Ladies description `'The shades of flowers, except white flowers'` →
  `'The shades of flowers in pastel colours'` (the "except white flowers"
  clause is dropped entirely).

### 9. Remove the maps background
- **Files:** `apps/invitation/src/components/sections/LocationMap.tsx`,
  `server/src/scripts/seed-dega-ditta.ts`
- Seed drops `backgroundImage: venueBgImg` from the `location-map` section.
- Refactor `LocationMap` so the **elegant header** (font-heading `heading` +
  venue subtitle, English styling) renders whenever a `heading` prop is provided
  — decoupled from `backgroundImage`. Without a `heading`, it keeps the legacy
  Indonesian eyebrow (`Lokasi`) + venue heading for other clients.
- dega-ditta keeps `heading: 'Venue'`, so the section stays clean and English
  with no backdrop. The map iframe, address, and `GOOGLE MAPS` button are
  unaffected.

### 10. Add the maps background to the Cover (amplop) screen
- **Files:** `apps/invitation/src/components/Cover.tsx`,
  `apps/invitation/src/app/[slug]/page.tsx`,
  `server/src/scripts/seed-dega-ditta.ts`
- "Amplop" = the **Cover / opening screen** (the envelope screen guests tap to
  open).
- Add an optional `backgroundImage` prop to Cover's `coverImage` branch; render
  `venue-bg.png` as the screen background over the cream base, with a subtle
  semi-transparent cream overlay so the "Dega and Ditta" title stays legible.
  Sizing/position tuned by running (centered; `cover` or `contain`).
- `page.tsx` passes `backgroundImage={coverSection.data.coverBackground}`.
- Seed adds `coverBackground: venueBgImg` to the `cover` section data.

## Files touched (11)

Seeds:
- `server/src/scripts/seed-floral-plum-template.ts`
- `server/src/scripts/seed-dega-ditta.ts`

Components / page:
- `apps/invitation/src/components/sections/HeroLight.tsx`
- `apps/invitation/src/components/sections/Footer.tsx`
- `apps/invitation/src/components/sections/Wishes.tsx`
- `apps/invitation/src/components/sections/Events.tsx`
- `apps/invitation/src/components/sections/Couple.tsx`
- `apps/invitation/src/components/sections/LocationMap.tsx`
- `apps/invitation/src/components/Cover.tsx`
- `apps/invitation/src/components/SectionRenderer.tsx`
- `apps/invitation/src/app/[slug]/page.tsx`

## Verification

1. Re-run seeds (template first, then client):
   ```
   npx tsx server/src/scripts/seed-floral-plum-template.ts
   npx tsx server/src/scripts/seed-dega-ditta.ts
   ```
2. `npm run lint` (TypeScript type-check).
3. Load `http://localhost:3001/dega-ditta` and
   `http://localhost:3001/dega-ditta?to=wayan-sudana`; visually confirm:
   - Imperial Script headings throughout.
   - Hero: two mirrored candle/flower clusters framing the couple at the bottom
     corners.
   - Cover: `venue-bg.png` backdrop, title legible.
   - Footer: no "Nusantara Wedding" eyebrow.
   - Schedule: "Rundown" heading, no "Hari Istimewa", English labels/dates.
   - Wishes: English throughout.
   - Happy Couple: larger bouquet & rings, no clipping.
   - Location: clean English "Venue" header, no backdrop.
   - Music: new track plays on open.
4. Spot-check a nusantara invitation (Indonesian defaults + region footer label
   unchanged) and a non-region demo (mvp/floral) to confirm it still shows the
   "Nusantara Wedding" fallback — i.e. change #3 is plum-only.

## Out of scope

- The untracked `dega-dita-asets2/` asset folder.
- Any change to dega-lauditta, nusantara, or budi-sari content.
