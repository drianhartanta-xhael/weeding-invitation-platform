# Design — `dega-ditta` plum/mauve floral invitation variant

**Date:** 2026-05-21
**Branch:** `feat/floral-watercolor-template`
**Status:** Approved

## Summary

Create a second public invitation, `/dega-ditta`, for the **same wedding** as the
existing `/dega-lauditta` (Ditta = Lauditta's casual nickname; the Canva site
`degadittaday.my.canva.site` brands the couple as "Dega and Ditta"). It is a styled
clone of `/dega-lauditta`: identical section structure and event data, but a new
plum/mauve/sage colour palette, new prewedding photos, and a new floral decoration
variant tinted to match.

The existing `/dega-lauditta` invitation, the `floral-watercolor` template, and the
`floral` decoration module are left **completely untouched**. No shared components,
no renderer, no model changes — only additive files plus one registry entry.

## Goals

- A cohesive plum-themed invitation at `/dega-ditta` reachable for the evening preview.
- Reuse all of Dega & Lauditta's event data (parents, Bali venue, 26 Jul 2026 events,
  bank account, music, the 8-section layout).
- Zero risk to the existing `/dega-lauditta` invitation.

## Non-goals

- No changes to `SectionRenderer`, the dual-mode page, or any Mongoose model. (One
  small, backward-compatible tweak to the shared `LocationMap` component — see §5 — is
  in scope, surfaced by the precise-venue requirement.)
- No admin-UI work — seeding is via scripts, content tweakable later through the
  existing dashboard.
- Not using the Canva cupid clip-art (licensing).

## Colour palette

User-supplied 5 colours, mapped to roles:

| Role | Hex | Where it appears |
| --- | --- | --- |
| Primary (deep plum) | `#823460` | Hero background, headings, names, decoration primary |
| Accent (mauve) | `#ba6193` | Labels, "&", RSVP/Wishes background, flower centre |
| Bloom-light (soft mauve) | `#c989ae` | Floral petals |
| Leaf / muted (sage-greige) | `#d9d5c7` | Floral leaves, soft fills, decoration `dark` |
| Background (cream) | `#f5f3eb` | Page + section background, light text on plum |

## Architecture

The platform resolves theme colours from the **Template** `config`
(`primaryColor`/`secondaryColor`/`accentColor` → CSS vars `--wedding-*`) and resolves
decoration colours (the SVG blooms/leaves + page background) from a **decoration
module** selected by `Template.decorationStyle` via `DECORATION_REGISTRY`. To recolour
both layers without disturbing the existing template, we add a parallel decoration
module + template + client.

### 1. Decoration module — `apps/invitation/src/lib/decorations/floral-plum/index.tsx`

Clone of `floral/index.tsx`. Bloom/Sprig/FloralStrip/HeroDecor/SectionDecor/FooterDecor
shapes are byte-for-byte identical; only the palette constants change:

```ts
export const floralPlumColors: DecorColors = {
  bg: '#f5f3eb',
  surface: '#FFFFFF',
  accent: '#ba6193',
  primary: '#823460',
  dark: '#d9d5c7',
};
const BLOOM = '#c989ae';      // petals
const BLOOM_ALT = '#ba6193';  // flower centre (replaces the old gold #E7C46B)
const LEAF = '#d9d5c7';       // sage-greige leaves
```

Register in `apps/invitation/src/lib/decorations/registry.ts`:

```ts
import { HeroDecor as FloralPlumHeroDecor, SectionDecor as FloralPlumSectionDecor,
         FooterDecor as FloralPlumFooterDecor, floralPlumColors } from './floral-plum';
// ...
'floral-plum': {
  colors: floralPlumColors,
  HeroDecor: FloralPlumHeroDecor,
  SectionDecor: FloralPlumSectionDecor,
  FooterDecor: FloralPlumFooterDecor,
},
```

If a `decorationStyle` is ever unregistered, the page already falls back to the `none`
config — no crash path is introduced.

### 2. Template seed — `server/src/scripts/seed-floral-plum-template.ts`

Clone of `seed-floral-template.ts` with:

- `name: 'Floral Watercolor — Plum'`, `slug: 'floral-watercolor-plum'`,
  `decorationStyle: 'floral-plum'`
- `config`: `primaryColor '#823460'`, `secondaryColor '#f5f3eb'`, `accentColor '#ba6193'`;
  fonts unchanged (`Pinyon Script` / `Poppins`) — reproduces the pink-script look as
  live text
- `stylePresets`:
  - `light: { bg: '#f5f3eb', text: '#6E5A60' }`
  - `dark:  { bg: '#823460', text: '#f5f3eb' }`  → deep-plum Cover overlay
  - `accent:{ bg: '#ba6193', text: '#FFFFFF' }`  → RSVP / Wishes
  - `image-1: { bg: '#EFEAE0', text: '#6E5A60' }`
  - `image-2: { bg: '#E7E1D2', text: '#6E5A60' }`
- `defaultSections`: same 9 entries as the floral template

Idempotent upsert keyed on `slug`, same as the source script.

### 3. Client seed — `server/src/scripts/seed-dega-ditta.ts`

Clone of `seed-dega-lauditta.ts`, reusing the parents, two Bali events (26 Jul 2026),
BCA bank account, music (`videoId: dt25SFw8H4Y`), `customContent`, and the 8 sections
(cover, couple-profile, gallery, location-map, event-detail, dress-code, rsvp, wishes).
Changes:

- `slug: 'dega-ditta'`; `templateId` resolved from `floral-watercolor-plum`
- top-level `groomName: 'Dega'`, `brideName: 'Ditta'` (drives Hero + Cover branding)
- couple-profile section keeps the formal names `Dega Aprillian` /
  `Lauditta Soraya Librata`
- asset base `P = '/assets/dega-ditta'`
- `heroPhoto = ${P}/couple.png` (the watercolor illustration)
- gallery = the 7 prewedding photos `2.jpg … 8.jpg`
- couple-profile `groomPhoto = ${P}/2.jpg`, `bridePhoto = ${P}/5.jpg` (placeholder
  crops from the gallery set; swappable later via the dashboard if solo portraits
  become available)
- location-map section: `venue: 'Hilton Garden Inn Bali, Nusa Dua'`,
  `address: 'Jl. Pratama No.57A, Tanjung, Benoa, South Kuta, Badung Regency, Bali 80361'`,
  `mapUrl:` the full Google Maps place URL for the venue (so the embed pins the exact
  spot and the button opens the canonical place page — see §5)
- guests: reuse the same 3 demo guests, scoped to the new client by `clientId`

Idempotent upsert keyed on `slug`. The script prints the local + `?to=` preview URLs,
matching the source.

### 4. Assets — `apps/invitation/public/assets/dega-ditta/`

Copy from the untracked source `dega-dita-asets2/`:

- `1.png` → `couple.png` (watercolor couple illustration, transparent bg)
- `2.jpg … 8.jpg` → gallery (web-optimised; the matching hi-res `*.png` duplicates are
  not copied)

**Excluded:**
- `12.png`, `13.png` — pink cupid/cherub line-art; reads as Canva stock clip-art, so out
  of bounds per the Canva content-license rule (Canva assets may only be used inside
  Canva).
- `11.png` — the "Dega and Ditta" script logotype; redundant because the Hero renders
  the names as Pinyon Script text. Available to wire in later if wanted.
- `attachments.zip` — source archive, not a web asset.

### 5. LocationMap button enhancement — `apps/invitation/src/components/sections/LocationMap.tsx`

`LocationMap` currently only honours `mapUrl` for the iframe when it contains
`/maps/embed`, and builds the "Buka di Google Maps" button link from `address` alone —
so a plain place URL in `mapUrl` is dead data. One backward-compatible change: prefer
`mapUrl` for the button link when present.

```ts
const mapsLink = mapUrl
  ? mapUrl
  : address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : 'https://maps.google.com';
```

The iframe logic is unchanged: a non-embed `mapUrl` still falls through to the
`address`-based embed, and the precise street address makes that embed pin the exact
venue. This change also affects `/dega-lauditta` — its button would open its existing
goo.gl `mapUrl` (the same Bali venue), which remains correct.

## Data flow (unchanged from existing)

1. Browser hits `/dega-ditta` → `[slug]/page.tsx` fetches `/invitations/dega-ditta`.
2. `templateId.config` colours set `--wedding-*` CSS vars; fonts injected.
3. `templateId.decorationStyle === 'floral-plum'` selects the plum decoration config.
4. `sections.length > 0` → slot-based renderer draws Cover → Hero → sections → Footer.

## Error handling

Minimal surface — additive config/seed only. Existing safeguards cover it: unknown
decoration style → `none` fallback; empty section `data` → optional-chaining guard in
`SectionRenderer` (already fixed). Seeds are idempotent upserts, safe to re-run.

## Verification

1. `npm run lint` — TypeScript type-check gate (no test framework in this repo).
2. Copy assets, then run seeds in order:
   `npx tsx server/src/scripts/seed-floral-plum-template.ts`
   `npx tsx server/src/scripts/seed-dega-ditta.ts`
3. Confirm `GET /api/invitations/dega-ditta` returns the 8 sections + plum template.
4. Preview `http://localhost:3001/dega-ditta` locally and via the ngrok tunnel;
   confirm the location embed pins Hilton Garden Inn and the button opens the exact
   place URL.
5. Regression: confirm `http://localhost:3001/dega-lauditta` renders unchanged (its
   location button now opens its own goo.gl link — same venue).

## Out of scope / follow-ups

- Solo portrait crops for the couple-profile section.
- Optionally rendering the `11.png` name logotype as a hero/cover image.
- An original (non-Canva) cherub motif, if a cupid accent is later desired.
