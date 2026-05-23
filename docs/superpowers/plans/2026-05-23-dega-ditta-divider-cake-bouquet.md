# Dega & Ditta Divider/Cake/Bouquet Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim three padded TRT illustrations and adjust their rendering so the bunga divider sits cleanly in-flow at each section's end, the rundown cake is tidy and prominent, and the white bouquet drops below the couple photo.

**Architecture:** A one-off Node + `sharp` script trims the transparent margins of `cake.png`, `bunga.png`, and `bouquet.png` in place. The section divider becomes a new optional `SectionDivider` slot on `DecorationConfig`, rendered in normal flow by `SectionRenderer` after each section's content (floral-plum drops its overlay bands). Cake size lives in `Events.tsx`; bouquet position in `Couple.tsx`. No seed/data changes.

**Tech Stack:** Next.js 14 (App Router) + Tailwind + Framer Motion; `sharp` (image trim, resolves from repo-root `node_modules`); Playwright MCP for visual verification.

**Testing note:** This repo has no test framework (per `CLAUDE.md`); these are asset + visual component changes. Per-task verification is the trim-script output and `npx tsc --noEmit`; final verification is Playwright screenshots + live tuning. No re-seed is required (all image paths are unchanged).

**Spec:** `docs/superpowers/specs/2026-05-23-dega-ditta-divider-cake-bouquet-design.md`

---

## File Structure

- `scripts/trim-dega-ditta-assets.mjs` (new) — one-off sharp trim of the 3 assets.
- `apps/invitation/public/assets/dega-ditta/{cake,bunga,bouquet}.png` — trimmed in place.
- `apps/invitation/src/lib/decorations/types.ts` — add optional `SectionDivider`.
- `apps/invitation/src/lib/decorations/floral-plum/index.tsx` — drop overlay bands; add in-flow `SectionDivider`.
- `apps/invitation/src/lib/decorations/registry.ts` — wire `SectionDivider` into floral-plum.
- `apps/invitation/src/components/SectionRenderer.tsx` — render `SectionDivider` in-flow.
- `apps/invitation/src/components/sections/Events.tsx` — enlarge event image.
- `apps/invitation/src/components/sections/Couple.tsx` — lower bouquet.

---

## Task 1: Trim the three TRT assets

**Files:**
- Create: `scripts/trim-dega-ditta-assets.mjs`
- Modify (in place): `apps/invitation/public/assets/dega-ditta/cake.png`, `bunga.png`, `bouquet.png`

- [ ] **Step 1: Write the trim script**

Create `scripts/trim-dega-ditta-assets.mjs` with exactly:

```js
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'apps/invitation/public/assets/dega-ditta');
const trt = path.join(root, 'dega-dita-asets2/TRT');

// in === out is safe: each source is fully read into a buffer before writing.
const jobs = [
  { src: path.join(trt, 'IMG_2288.PNG'), out: path.join(pub, 'cake.png') },
  { src: path.join(trt, 'bunga.png'), out: path.join(pub, 'bunga.png') },
  { src: path.join(pub, 'bouquet.png'), out: path.join(pub, 'bouquet.png') },
];

for (const job of jobs) {
  const before = await sharp(job.src).metadata();
  const buf = await sharp(job.src).trim().png().toBuffer();
  const after = await sharp(buf).metadata();
  await sharp(buf).toFile(job.out);
  console.log(`${path.basename(job.out)}: ${before.width}x${before.height} -> ${after.width}x${after.height}`);
}
```

- [ ] **Step 2: Run the trim script**

Run: `node scripts/trim-dega-ditta-assets.mjs`
Expected: three lines showing each image shrinking to a tight bounding box, e.g.:

```
cake.png: 2913x4134 -> <smaller w>x<smaller h>
bunga.png: 1772x1772 -> <full w>x<much smaller h>
bouquet.png: 2913x4134 -> <smaller w>x<smaller h>
```

(The exact trimmed dimensions vary; the point is each output is markedly smaller than its input, confirming the transparent margins were removed.)

- [ ] **Step 3: Commit**

```bash
git add scripts/trim-dega-ditta-assets.mjs apps/invitation/public/assets/dega-ditta/cake.png apps/invitation/public/assets/dega-ditta/bunga.png apps/invitation/public/assets/dega-ditta/bouquet.png
git commit -m "feat(dega-ditta): trim transparent margins on cake/bunga/bouquet"
```

---

## Task 2: In-flow section divider

**Files:**
- Modify: `apps/invitation/src/lib/decorations/types.ts`
- Modify: `apps/invitation/src/lib/decorations/floral-plum/index.tsx`
- Modify: `apps/invitation/src/lib/decorations/registry.ts`
- Modify: `apps/invitation/src/components/SectionRenderer.tsx`

- [ ] **Step 1: Add the optional `SectionDivider` slot to the type**

In `apps/invitation/src/lib/decorations/types.ts`, replace this exact block:

```ts
export interface DecorationConfig {
  colors: DecorColors;
  fontHeading?: string;   // Google Font URL override (optional)
  fontBody?: string;
  HeroDecor: FC<DecorProps>;
  SectionDecor: FC<DecorProps & { variant: SectionVariant }>;
  FooterDecor: FC<DecorProps>;
}
```

with:

```ts
export interface DecorationConfig {
  colors: DecorColors;
  fontHeading?: string;   // Google Font URL override (optional)
  fontBody?: string;
  HeroDecor: FC<DecorProps>;
  SectionDecor: FC<DecorProps & { variant: SectionVariant }>;
  SectionDivider?: FC<DecorProps>;   // optional in-flow divider rendered after each section
  FooterDecor: FC<DecorProps>;
}
```

- [ ] **Step 2: Replace floral-plum's overlay divider with an in-flow `SectionDivider`**

In `apps/invitation/src/lib/decorations/floral-plum/index.tsx`, replace this exact block:

```tsx
// A single watercolor wildflower-meadow cluster, centered at the bottom of a section.
function FloralDivider() {
  const style: CSSProperties = {
    position: 'absolute',
    left: '50%',
    bottom: -36,
    transform: 'translateX(-50%)',
    width: 320,
    maxWidth: '85%',
    height: 'auto',
    opacity: 0.9,
    pointerEvents: 'none',
  };
  return <img src={BUNGA} alt="" aria-hidden style={style} />;
}

// SectionDecor — a single watercolor wildflower divider centered at the bottom of every section.
export function SectionDecor(_props: DecorProps & { variant: SectionVariant }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <FloralDivider />
    </div>
  );
}
```

with:

```tsx
// SectionDecor — no overlay for the plum theme; the per-section motif is the in-flow SectionDivider below.
export function SectionDecor(_props: DecorProps & { variant: SectionVariant }) {
  return null;
}

// SectionDivider — a single trimmed wildflower-meadow cluster, centered and rendered in
// normal flow at the bottom of each section, with soft side fades so it blends in.
export function SectionDivider(_props: DecorProps) {
  const mask = 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, transparent 100%)';
  const imgStyle: CSSProperties = {
    width: 'min(320px, 70%)',
    height: 'auto',
    opacity: 0.9,
    WebkitMaskImage: mask,
    maskImage: mask,
    pointerEvents: 'none',
  };
  return (
    <div aria-hidden style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 28 }}>
      <img src={BUNGA} alt="" style={imgStyle} />
    </div>
  );
}
```

- [ ] **Step 3: Wire `SectionDivider` into the floral-plum registry entry**

In `apps/invitation/src/lib/decorations/registry.ts`, replace this exact import line:

```ts
import { HeroDecor as FloralPlumHeroDecor, SectionDecor as FloralPlumSectionDecor, FooterDecor as FloralPlumFooterDecor, floralPlumColors } from './floral-plum';
```

with:

```ts
import { HeroDecor as FloralPlumHeroDecor, SectionDecor as FloralPlumSectionDecor, SectionDivider as FloralPlumSectionDivider, FooterDecor as FloralPlumFooterDecor, floralPlumColors } from './floral-plum';
```

Then replace this exact block:

```ts
  'floral-plum': {
    colors: floralPlumColors,
    HeroDecor: FloralPlumHeroDecor,
    SectionDecor: FloralPlumSectionDecor,
    FooterDecor: FloralPlumFooterDecor,
  },
```

with:

```ts
  'floral-plum': {
    colors: floralPlumColors,
    HeroDecor: FloralPlumHeroDecor,
    SectionDecor: FloralPlumSectionDecor,
    SectionDivider: FloralPlumSectionDivider,
    FooterDecor: FloralPlumFooterDecor,
  },
```

- [ ] **Step 4: Render the divider in-flow in `SectionRenderer`**

In `apps/invitation/src/components/SectionRenderer.tsx`, replace this exact line:

```tsx
  const SectionDecor = decorConfig?.SectionDecor;
```

with:

```tsx
  const SectionDecor = decorConfig?.SectionDecor;
  const SectionDivider = decorConfig?.SectionDivider;
```

Then replace this exact block:

```tsx
            <div style={{ position: 'relative', zIndex: 1 }}>
              {section.data?.accentMotif && <AccentMotif name={section.data.accentMotif} />}
              {content}
            </div>
```

with:

```tsx
            <div style={{ position: 'relative', zIndex: 1 }}>
              {section.data?.accentMotif && <AccentMotif name={section.data.accentMotif} />}
              {content}
              {SectionDivider && !section.data?.noDecor && <SectionDivider colors={decorConfig!.colors} />}
            </div>
```

- [ ] **Step 5: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors (command exits silently).

- [ ] **Step 6: Commit**

```bash
git add apps/invitation/src/lib/decorations/types.ts apps/invitation/src/lib/decorations/floral-plum/index.tsx apps/invitation/src/lib/decorations/registry.ts apps/invitation/src/components/SectionRenderer.tsx
git commit -m "feat(dega-ditta): in-flow bunga section divider"
```

---

## Task 3: Enlarge the rundown cake

**Files:**
- Modify: `apps/invitation/src/components/sections/Events.tsx`

- [ ] **Step 1: Enlarge the per-event image**

In `apps/invitation/src/components/sections/Events.tsx`, replace this exact block:

```tsx
              <img
                src={event.image}
                alt=""
                aria-hidden
                className="w-24 h-auto mx-auto mb-4 object-contain"
              />
```

with:

```tsx
              <img
                src={event.image}
                alt=""
                aria-hidden
                className="w-44 sm:w-52 h-auto mx-auto mb-4 object-contain"
              />
```

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/Events.tsx
git commit -m "feat(dega-ditta): enlarge rundown event image (cake)"
```

---

## Task 4: Lower the white bouquet

**Files:**
- Modify: `apps/invitation/src/components/sections/Couple.tsx`

- [ ] **Step 1: Push the bouquet lower and re-balance its width**

In `apps/invitation/src/components/sections/Couple.tsx`, replace this exact block:

```tsx
              {bouquetImage && (
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-12 sm:-left-16 -bottom-6 w-36 sm:w-44 object-contain pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              )}
```

with:

```tsx
              {bouquetImage && (
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-14 sm:-left-20 -bottom-14 w-32 sm:w-40 object-contain pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              )}
```

(`-bottom-14` drops it below the photo, `-left-14 sm:-left-20` nudges it outward, `w-32 sm:w-40` re-balances against the untrimmed rings. These are starting values — tuned live in Task 5.)

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/Couple.tsx
git commit -m "feat(dega-ditta): lower bouquet below couple photo"
```

---

## Task 5: Visual verification + tuning (Playwright)

**Files:** none (operational; minor follow-up tweaks to Tasks 2–4 values as needed).

- [ ] **Step 1: Confirm dev servers are up**

Run: `curl -s -o /dev/null -w "inv:%{http_code} " http://localhost:3001/dega-ditta; curl -s -o /dev/null -w "api:%{http_code}\n" http://localhost:5000/api/invitations/dega-ditta`
Expected: `inv:200 api:200`. If down, start with `npm run dev` (needs MongoDB via `docker-compose up -d`).

- [ ] **Step 2: Screenshot the three areas**

Using Playwright MCP at viewport ~430×900, navigate to
`http://localhost:3001/dega-ditta?to=wayan-sudana`, click to open the cover, then
capture: (a) a section divider between two sections, (b) the rundown cake, (c) the
Happy Couple bouquet. Confirm:
- divider is centered, blended (side fades), spaced, not overlapping content;
- cake is tidy and prominent, no floating empty space;
- bouquet sits below the photo, balanced with the rings.

- [ ] **Step 3: Tune values if needed, then commit**

If any value needs adjustment, edit the relevant file from Tasks 2–4 (divider
`width`/`opacity`/`paddingBottom` in `floral-plum/index.tsx`; cake `w-44 sm:w-52`
in `Events.tsx`; bouquet offsets/width in `Couple.tsx`), re-screenshot, then:

```bash
git add -A
git commit -m "fix(dega-ditta): tune divider/cake/bouquet visuals"
```

(If no tuning is needed, skip the commit.)

- [ ] **Step 4: Final type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors. No re-seed required.

---

## Notes for the executor

- `SectionDivider` is an optional config field, so all other decorations (none, jawa, bali, sunda, minang, betawi, batak, floral) keep working unchanged — only `floral-plum` (dega-ditta) renders it.
- Only dega-ditta sets an event `image`, so enlarging the `Events` image is effectively scoped to it.
- The trim script reads each source fully into a buffer before writing, so `bouquet.png` (in === out) is safe; git preserves the pre-trim original.
- Visual values in Tasks 2–4 are starting points; expect to nudge them in Task 5.
