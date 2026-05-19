# Floral Watercolor Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new "Floral Watercolor" invitation template that recreates the Canva design for client Dega & Lauditta, using the platform's existing template + decoration + slot-component architecture.

**Architecture:** A new `Template` document (seeded) drives colors/fonts/sections. A new SVG-based decoration style `floral` draws flat-vector flowers on every section. One new slot component `dress-code` is added; the existing `event-detail`, `Hero`, and `Cover` are enhanced (theme-aware + photo support). All wired through the existing dual-mode renderer in `apps/invitation/src/app/[slug]/page.tsx`.

**Tech Stack:** TypeScript, Next.js 14 (App Router), Express + Mongoose, Framer Motion, Zod. Monorepo with npm workspaces; shared types in `@wedding/shared`.

**Spec:** `docs/superpowers/specs/2026-05-19-floral-watercolor-template-design.md`

---

## Conventions for this plan

- **No automated test framework exists** in this repo (confirmed in `CLAUDE.md`). The verification gate for every task is the type-checker: `npm run lint` (runs TypeScript type-check across the monorepo). Tasks that change rendering also have a manual browser check, consolidated in Task 12.
- Run all commands from the repo root `D:\CV\apps\wedding-invitation-platform` unless stated.
- Each task ends with a commit. Do the work on a dedicated branch — before Task 1 run:
  `git checkout -b feat/floral-watercolor-template`
- **Deviation from spec (acknowledged):** Spec Item 4 mentions an admin editor input for `heroPhoto`. The admin app currently has **no `customContent` editor at all** (verified — `customContent` is never read/written in `apps/web`). Building one is out of scope here. `heroPhoto` is added to the data model and set via the seed. Admin editing of `customContent` is a pre-existing gap, left for a separate effort.

---

## File Structure

**Server**
- `server/src/models/Template.ts` — add `decorationStyle` field (modify)
- `server/src/validators/template.ts` — add `decorationStyle` to schema (modify)
- `server/src/models/Client.ts` — add `customContent.heroPhoto` field (modify)
- `server/src/scripts/seed-floral-template.ts` — new seed: the Floral Watercolor `Template` (create)
- `server/src/scripts/seed-dega-lauditta.ts` — rewrite: real Dega & Lauditta data on the floral template (modify)

**Shared types**
- `packages/shared/src/types/components.ts` — add `dress-code` component (modify)

**Invitation app**
- `apps/invitation/src/lib/decorations/floral/index.tsx` — new SVG decoration style (create)
- `apps/invitation/src/lib/decorations/registry.ts` — register `floral` (modify)
- `apps/invitation/src/components/sections/DressCode.tsx` — new component (create)
- `apps/invitation/src/components/AccentMotif.tsx` — small SVG motif library for per-section accents (create)
- `apps/invitation/src/components/SectionRenderer.tsx` — add `dress-code` case + `accentMotif` rendering (modify)
- `apps/invitation/src/components/sections/Events.tsx` — make theme-aware (modify)
- `apps/invitation/src/components/sections/Hero.tsx` — support a hero photo (modify)
- `apps/invitation/src/components/Cover.tsx` — make theme-aware + floral decoration (modify)
- `apps/invitation/src/app/[slug]/page.tsx` — pass `heroPhoto` + new Cover props (modify)
- `apps/invitation/public/assets/dega-lauditta/` — copied couple photos (create)

**Admin app**
- `apps/web/src/app/(dashboard)/templates/[id]/page.tsx` — add `decorationStyle` field + register `cover`/`dress-code` (modify)

---

## Task 1: Add `decorationStyle` to the Template model

**Context:** `seed-nusantara.ts` writes `decorationStyle` and `page.tsx` reads `templateId.decorationStyle`, but `Template.ts` never declares the field. Under Mongoose strict mode the field is silently dropped on save — meaning the Nusantara decorations likely never persisted. This task fixes the schema so the floral template (and Nusantara) can store it.

**Files:**
- Modify: `server/src/models/Template.ts`
- Modify: `server/src/validators/template.ts`

- [ ] **Step 1: Add `decorationStyle` to the Template interface**

In `server/src/models/Template.ts`, in `interface ITemplateDocument`, add the field right after `isActive: boolean;`:

```typescript
  isActive: boolean;
  decorationStyle: string;
```

- [ ] **Step 2: Add `decorationStyle` to the Template schema**

In the same file, in `templateSchema`, add the field right after the `isActive` block (after its closing `},`):

```typescript
    isActive: {
      type: Boolean,
      default: true,
    },
    decorationStyle: {
      type: String,
      default: 'none',
    },
```

- [ ] **Step 3: Add `decorationStyle` to the Zod validator**

In `server/src/validators/template.ts`, add one line to `createTemplateSchema` after `isActive: z.boolean().optional(),`:

```typescript
  isActive: z.boolean().optional(),
  decorationStyle: z.string().optional(),
```

(`updateTemplateSchema` is `createTemplateSchema.partial()`, so it inherits the field automatically.)

- [ ] **Step 4: Type-check**

Run: `npm run lint`
Expected: PASS (no type errors).

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Template.ts server/src/validators/template.ts
git commit -m "fix(server): declare decorationStyle field on Template model"
```

---

## Task 2: Add the `dress-code` component to shared types

**Context:** `packages/shared/src/types/components.ts` is the metadata-driven registry; the admin re-exports it (`apps/web/.../constants.ts` → `COMPONENT_REGISTRY = SHARED_REGISTRY`), so adding it here surfaces it in the admin Sections editor automatically.

**Files:**
- Modify: `packages/shared/src/types/components.ts`

- [ ] **Step 1: Add `dress-code` to `COMPONENT_IDS`**

In `packages/shared/src/types/components.ts`, add `'dress-code'` to the `COMPONENT_IDS` array (after `'location-map'`):

```typescript
export const COMPONENT_IDS = [
  'cover',
  'couple-profile',
  'event-detail',
  'gallery',
  'donation',
  'rsvp',
  'wishes',
  'countdown',
  'story',
  'location-map',
  'dress-code',
] as const;
```

- [ ] **Step 2: Add the `DressCodeData` interface**

Add this interface right after the `LocationMapData` interface:

```typescript
export interface DressCodeData {
  note?: string;
  groups: {
    label: string;
    description: string;
    figure?: string; // 'gentlemen' | 'ladies' — selects a built-in SVG silhouette
    image?: string;   // optional image URL; overrides the silhouette when set
  }[];
}
```

- [ ] **Step 3: Add `DressCodeData` to the `ComponentData` union**

Append it to the `ComponentData` union type:

```typescript
export type ComponentData =
  | CoverData
  | CoupleProfileData
  | EventDetailData
  | GalleryData
  | DonationData
  | RsvpData
  | WishesData
  | CountdownData
  | StoryData
  | LocationMapData
  | DressCodeData;
```

- [ ] **Step 4: Add the `dress-code` entry to `COMPONENT_REGISTRY`**

Add this object as the last entry of the `COMPONENT_REGISTRY` array (after the `location-map` entry):

```typescript
  {
    id: 'dress-code',
    label: 'Dress Code',
    description: 'Dress code guidance per guest group with figure silhouettes',
    icon: 'shirt',
    fields: [
      { key: 'note', label: 'Catatan (opsional)', type: 'textarea', placeholder: 'e.g. Kami akan senang bila tamu mengenakan...' },
      {
        key: 'groups',
        label: 'Grup',
        type: 'array',
        arrayFields: [
          { key: 'label', label: 'Label', type: 'text', required: true, placeholder: 'e.g. Gentlemen' },
          { key: 'description', label: 'Keterangan', type: 'text', required: true, placeholder: 'e.g. Earth tone' },
          { key: 'figure', label: 'Siluet (gentlemen / ladies)', type: 'text', placeholder: 'gentlemen' },
          { key: 'image', label: 'URL Gambar (opsional)', type: 'url' },
        ],
      },
    ],
  },
```

- [ ] **Step 5: Add the `dress-code` case to `getDefaultComponentData`**

In the `switch` inside `getDefaultComponentData`, add this case right before `default:`:

```typescript
    case 'dress-code':
      return { note: '', groups: [] };
```

- [ ] **Step 6: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types/components.ts
git commit -m "feat(shared): add dress-code component to registry"
```

---

## Task 3: Build the `floral` SVG decoration style

**Context:** Decoration styles live in `apps/invitation/src/lib/decorations/<name>/index.tsx` and are mapped by key in `registry.ts`. Each exports a `DecorColors` object and three components (`HeroDecor`, `SectionDecor`, `FooterDecor`) typed by `DecorProps` from `../types`. Follow the pattern of `bali/index.tsx`.

**Files:**
- Create: `apps/invitation/src/lib/decorations/floral/index.tsx`
- Modify: `apps/invitation/src/lib/decorations/registry.ts`

- [ ] **Step 1: Create the floral decoration file**

Create `apps/invitation/src/lib/decorations/floral/index.tsx` with this exact content:

```tsx
'use client';

import type { CSSProperties } from 'react';
import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const floralColors: DecorColors = {
  bg: '#F7F3EE',
  surface: '#FFFFFF',
  accent: '#C9477E',
  primary: '#C9477E',
  dark: '#F0E3DC',
};

// Internal palette — flowers/leaves use more than one accent colour.
const BLOOM = '#E59BB6';
const BLOOM_ALT = '#E7C46B';
const LEAF = '#9FB484';

// A single 5-petal bloom centred at (0,0).
function Bloom({ size, color = BLOOM }: { size: number; color?: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx={0}
          cy={-size * 0.55}
          rx={size * 0.3}
          ry={size * 0.55}
          fill={color}
          transform={`rotate(${deg})`}
        />
      ))}
      <circle r={size * 0.28} fill={BLOOM_ALT} />
    </g>
  );
}

// A leafy sprig: a curved stem with three leaves and a bloom at the tip.
function Sprig({ size }: { size: number }) {
  const s = size;
  return (
    <g>
      <path
        d={`M 0,0 Q ${s * 0.4},${-s * 0.4} ${s * 0.2},${-s}`}
        fill="none"
        stroke={LEAF}
        strokeWidth={s * 0.06}
        strokeLinecap="round"
      />
      {[0.25, 0.5, 0.75].map((t, i) => (
        <ellipse
          key={i}
          cx={s * 0.3}
          cy={-s * t}
          rx={s * 0.22}
          ry={s * 0.1}
          fill={LEAF}
          transform={`rotate(${i % 2 === 0 ? 35 : -35} ${s * 0.3} ${-s * t})`}
        />
      ))}
      <g transform={`translate(${s * 0.2}, ${-s})`}>
        <Bloom size={s * 0.4} />
      </g>
    </g>
  );
}

// A horizontal strip of alternating blooms + sprigs, used along section edges.
function FloralStrip({ width, flip }: { width: number; flip?: boolean }) {
  const items = Array.from({ length: Math.ceil(width / 90) + 1 }, (_, i) => i);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height={70}
      viewBox={`0 0 ${width} 70`}
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', transform: flip ? 'scaleY(-1)' : undefined }}
    >
      {items.map((i) => (
        <g key={i} transform={`translate(${i * 90 + 30}, 56)`} opacity={0.5}>
          {i % 2 === 0 ? <Sprig size={44} /> : <g transform="translate(0,-18)"><Bloom size={26} /></g>}
        </g>
      ))}
    </svg>
  );
}

// HeroDecor — large sprig clusters in the four corners.
export function HeroDecor(_props: DecorProps) {
  const corner = (style: CSSProperties, rot: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={150}
      height={150}
      viewBox="0 0 150 150"
      style={{ position: 'absolute', ...style }}
    >
      <g transform={`translate(40,140) rotate(${rot})`} opacity={0.55}>
        <Sprig size={90} />
        <g transform="translate(60,-10)"><Sprig size={60} /></g>
      </g>
    </svg>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {corner({ top: 0, left: 0 }, 0)}
      {corner({ top: 0, right: 0, transform: 'scaleX(-1)' }, 0)}
      {corner({ bottom: 0, left: 0, transform: 'scaleY(-1)' }, 0)}
      {corner({ bottom: 0, right: 0, transform: 'scale(-1,-1)' }, 0)}
    </div>
  );
}

// SectionDecor — floral strips along the top and bottom edges of every section.
export function SectionDecor(_props: DecorProps & { variant: SectionVariant }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <FloralStrip width={900} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <FloralStrip width={900} flip />
      </div>
    </div>
  );
}

// FooterDecor — a single floral strip across the top of the footer.
export function FooterDecor(_props: DecorProps) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 70, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <FloralStrip width={1000} />
    </div>
  );
}
```

- [ ] **Step 2: Register the `floral` decoration**

In `apps/invitation/src/lib/decorations/registry.ts`, add an import after the existing decoration imports (after the `batak` import line):

```typescript
import { HeroDecor as FloralHeroDecor, SectionDecor as FloralSectionDecor, FooterDecor as FloralFooterDecor, floralColors } from './floral';
```

Then add a `floral` entry to `DECORATION_REGISTRY`, after the `batak` entry:

```typescript
  batak: {
    colors: batakColors,
    HeroDecor: BatakHeroDecor,
    SectionDecor: BatakSectionDecor,
    FooterDecor: BatakFooterDecor,
  },
  floral: {
    colors: floralColors,
    HeroDecor: FloralHeroDecor,
    SectionDecor: FloralSectionDecor,
    FooterDecor: FloralFooterDecor,
  },
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/lib/decorations/floral/index.tsx apps/invitation/src/lib/decorations/registry.ts
git commit -m "feat(invitation): add floral SVG decoration style"
```

---

## Task 4: Build the `DressCode` component

**Files:**
- Create: `apps/invitation/src/components/sections/DressCode.tsx`
- Modify: `apps/invitation/src/components/SectionRenderer.tsx`

- [ ] **Step 1: Create the `DressCode` component**

Create `apps/invitation/src/components/sections/DressCode.tsx` with this exact content:

```tsx
'use client';

import { motion } from 'framer-motion';

interface DressGroup {
  label: string;
  description: string;
  figure?: string;
  image?: string;
}

interface DressCodeProps {
  note?: string;
  groups: DressGroup[];
}

// Flat-vector silhouette of a standing man.
function GentlemenFigure({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 150" fill={color} aria-hidden>
      <circle cx="40" cy="15" r="13" />
      <rect x="25" y="30" width="30" height="54" rx="8" />
      <rect x="30" y="80" width="9" height="62" rx="3" />
      <rect x="41" y="80" width="9" height="62" rx="3" />
    </svg>
  );
}

// Flat-vector silhouette of a standing woman in a dress.
function LadiesFigure({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 150" fill={color} aria-hidden>
      <circle cx="40" cy="15" r="13" />
      <path d="M40 28 L64 142 H16 Z" />
      <rect x="36" y="138" width="3" height="8" />
      <rect x="42" y="138" width="3" height="8" />
    </svg>
  );
}

export default function DressCode({ note, groups }: DressCodeProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <section className="py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="font-heading text-4xl md:text-5xl italic" style={{ color: 'var(--wedding-primary, #C9477E)' }}>
          Dress Code
        </h2>
        {note && <p className="mt-3 text-sm max-w-md mx-auto opacity-80">{note}</p>}
      </motion.div>

      <div className="max-w-2xl mx-auto grid gap-10 sm:grid-cols-2">
        {groups.map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-28 h-40 flex items-end justify-center mb-3">
              {g.image ? (
                <img src={g.image} alt={g.label} className="max-h-full object-contain" />
              ) : g.figure === 'ladies' ? (
                <LadiesFigure color="var(--wedding-accent, #D98FA8)" />
              ) : (
                <GentlemenFigure color="var(--wedding-accent, #D98FA8)" />
              )}
            </div>
            <p className="font-medium text-lg" style={{ color: 'var(--wedding-primary, #C9477E)' }}>
              {g.label}
            </p>
            <p className="text-sm opacity-75 mt-0.5">{g.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire `dress-code` into `SectionRenderer`**

In `apps/invitation/src/components/SectionRenderer.tsx`, add the import after the other section imports (after `import LocationMap from './sections/LocationMap';`):

```typescript
import DressCode from './sections/DressCode';
```

Then in the `switch (section.componentId)` block, add this case right before `default:`:

```typescript
          case 'dress-code':
            content = (
              <DressCode
                note={section.data.note}
                groups={section.data.groups || []}
              />
            );
            break;
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/components/sections/DressCode.tsx apps/invitation/src/components/SectionRenderer.tsx
git commit -m "feat(invitation): add DressCode section component"
```

---

## Task 5: Per-section accent motifs

**Context:** Some sections show a small decorative motif above their content (Canva used cupids/rings/etc.). This is done generically: an optional `section.data.accentMotif` string keys into a small SVG library. No schema change — section `data` is `Mixed`.

**Files:**
- Create: `apps/invitation/src/components/AccentMotif.tsx`
- Modify: `apps/invitation/src/components/SectionRenderer.tsx`

- [ ] **Step 1: Create the `AccentMotif` library**

Create `apps/invitation/src/components/AccentMotif.tsx` with this exact content:

```tsx
'use client';

// Small decorative SVG motifs placed at the top of a section.
// Selected per-section via section.data.accentMotif.

function Rings() {
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="11" stroke="var(--wedding-accent, #D98FA8)" strokeWidth="3" />
      <circle cx="30" cy="18" r="11" stroke="var(--wedding-primary, #C9477E)" strokeWidth="3" />
    </svg>
  );
}

function Hearts() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" aria-hidden>
      <path
        d="M20 28 C 6 18, 8 6, 20 12 C 32 6, 34 18, 20 28 Z"
        fill="var(--wedding-primary, #C9477E)"
      />
    </svg>
  );
}

function Sprig() {
  return (
    <svg width="60" height="28" viewBox="0 0 60 28" aria-hidden>
      <path d="M4 14 H56" stroke="var(--wedding-accent, #D98FA8)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="14" r="6" fill="var(--wedding-primary, #C9477E)" />
      <circle cx="14" cy="14" r="3" fill="var(--wedding-accent, #D98FA8)" />
      <circle cx="46" cy="14" r="3" fill="var(--wedding-accent, #D98FA8)" />
    </svg>
  );
}

function Bloom() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <g transform="translate(18,18)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="0" cy="-9" rx="5" ry="9" fill="var(--wedding-accent, #D98FA8)" transform={`rotate(${deg})`} />
        ))}
        <circle r="5" fill="var(--wedding-primary, #C9477E)" />
      </g>
    </svg>
  );
}

const MOTIFS: Record<string, () => JSX.Element> = {
  rings: Rings,
  hearts: Hearts,
  sprig: Sprig,
  bloom: Bloom,
};

export default function AccentMotif({ name }: { name: string }) {
  const Motif = MOTIFS[name];
  if (!Motif) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 28 }}>
      <Motif />
    </div>
  );
}
```

- [ ] **Step 2: Render `accentMotif` in `SectionRenderer`**

In `apps/invitation/src/components/SectionRenderer.tsx`, add the import after `import DressCode from './sections/DressCode';`:

```typescript
import AccentMotif from './AccentMotif';
```

Then find the JSX block that wraps each section's content:

```tsx
            <div style={{ position: 'relative', zIndex: 1 }}>
              {content}
            </div>
```

Replace it with:

```tsx
            <div style={{ position: 'relative', zIndex: 1 }}>
              {section.data.accentMotif && <AccentMotif name={section.data.accentMotif} />}
              {content}
            </div>
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/components/AccentMotif.tsx apps/invitation/src/components/SectionRenderer.tsx
git commit -m "feat(invitation): add per-section accent motifs"
```

---

## Task 6: Hero photo support

**Context:** The Canva hero shows a cut-out couple photo. `Hero` is currently text-only. Add a `heroPhoto` field to `customContent`, resolve it in `page.tsx`, and render it in `Hero`.

**Files:**
- Modify: `server/src/models/Client.ts`
- Modify: `apps/invitation/src/app/[slug]/page.tsx`
- Modify: `apps/invitation/src/components/sections/Hero.tsx`

- [ ] **Step 1: Add `heroPhoto` to the Client model**

In `server/src/models/Client.ts`, in `interface IClientDocument`, add `heroPhoto` to `customContent`:

```typescript
  customContent: {
    heroTitle: string;
    heroSubtitle: string;
    bodyGreeting: string;
    footerTitle: string;
    footerMessage: string;
    heroPhoto: string;
  };
```

And in `clientSchema`, in the `customContent` block:

```typescript
    customContent: {
      heroTitle: { type: String, default: '' },
      heroSubtitle: { type: String, default: '' },
      bodyGreeting: { type: String, default: '' },
      footerTitle: { type: String, default: '' },
      footerMessage: { type: String, default: '' },
      heroPhoto: { type: String, default: '' },
    },
```

- [ ] **Step 2: Pass `heroPhoto` through `page.tsx`**

In `apps/invitation/src/app/[slug]/page.tsx`, in the `CustomContent` interface, add:

```typescript
interface CustomContent {
  heroTitle?: string;
  heroSubtitle?: string;
  bodyGreeting?: string;
  footerTitle?: string;
  footerMessage?: string;
  heroPhoto?: string;
}
```

In the content-resolution block (near `const footerMessage = ...`), add:

```typescript
  const heroPhoto = cc?.heroPhoto || '';
```

Then in the **slot-based** `<Hero ... />` (the one inside the `hasSections` branch), add the `heroPhoto` prop:

```tsx
              <Hero
                groomName={invitation.groomName}
                brideName={invitation.brideName}
                eventDate={invitation.eventDate}
                venue={invitation.events?.[0]?.venue}
                guestName={guest?.invitationName}
                heroTitle={heroTitle}
                bodyGreeting={bodyGreeting}
                heroPhoto={heroPhoto}
                regionStripe={regionStripe}
                decorConfig={decorConfig}
              />
```

- [ ] **Step 3: Render the photo in `Hero`**

In `apps/invitation/src/components/sections/Hero.tsx`, add `heroPhoto` to `HeroProps` and the destructured params:

```typescript
interface HeroProps {
  groomName: string;
  brideName: string;
  eventDate: string;
  venue?: string;
  guestName?: string;
  heroTitle?: string;
  bodyGreeting?: string;
  heroPhoto?: string;
  regionStripe?: string;
  decorConfig?: unknown;
}
```

```typescript
export default function Hero({ groomName, brideName, eventDate, venue, guestName, heroTitle, bodyGreeting, heroPhoto, regionStripe }: HeroProps) {
```

Then, inside the centered `motion.div`, right after the opening `<motion.p>...{heroTitle}...</motion.p>` block and before the `{bodyGreeting && ...}` block, insert the photo:

```tsx
        {heroPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mx-auto mb-6 overflow-hidden"
            style={{
              width: 220,
              height: 260,
              borderRadius: '110px 110px 18px 18px',
              border: '3px solid var(--wedding-accent, #C8A84B)',
            }}
          >
            <img src={heroPhoto} alt={`${groomName} & ${brideName}`} className="w-full h-full object-cover" />
          </motion.div>
        )}
```

- [ ] **Step 4: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Client.ts apps/invitation/src/app/[slug]/page.tsx apps/invitation/src/components/sections/Hero.tsx
git commit -m "feat: support hero photo via customContent.heroPhoto"
```

---

## Task 7: Make `event-detail` theme-aware

**Context:** `Events.tsx` hardcodes dark-theme values (`rgba(255,255,255,0.07)` card background, gold borders, `var(--wedding-secondary)` light text). On the light floral background the cards are invisible. Make colors inherit from the section, and hide empty venue/address (the floral itinerary has no venue per row).

**Files:**
- Modify: `apps/invitation/src/components/sections/Events.tsx`

- [ ] **Step 1: Make the card and text colors theme-aware**

In `apps/invitation/src/components/sections/Events.tsx`:

Replace the section heading `<h2>`'s inline color so it uses the primary color instead of `--wedding-secondary`:

```tsx
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #C8A84B)' }}>
          Hari Istimewa
        </h2>
```

Replace the per-event card `motion.div`'s `style` prop:

```tsx
            style={{
              backgroundColor: 'color-mix(in srgb, currentColor 6%, transparent)',
              border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
            }}
```

Replace the card content wrapper `<div className="space-y-3 text-sm" style={{ color: ... }}>` so it inherits the section text color:

```tsx
            <div className="space-y-3 text-sm">
```

- [ ] **Step 2: Hide empty venue / address**

In the same `Events.tsx`, replace the venue/address block:

```tsx
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Tempat</p>
                <p>{event.venue}</p>
                {event.address && <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{event.address}</p>}
              </div>
```

with:

```tsx
              {event.venue && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Tempat</p>
                  <p>{event.venue}</p>
                  {event.address && <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{event.address}</p>}
                </div>
              )}
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/components/sections/Events.tsx
git commit -m "refactor(invitation): make event-detail theme-aware"
```

---

## Task 8: Make `Cover` theme-aware + floral decoration

**Context:** `Cover.tsx` hardcodes dark-theme colors (`#6B1020`, gold `#C8A84B`, cream text). Make `accent` and text color props, and accept an optional decoration component so the floral cover shows flowers. The `bg` prop already exists.

**Files:**
- Modify: `apps/invitation/src/components/Cover.tsx`
- Modify: `apps/invitation/src/app/[slug]/page.tsx`

- [ ] **Step 1: Rewrite `Cover.tsx` to use props for colors + decoration**

Replace the entire contents of `apps/invitation/src/components/Cover.tsx` with:

```tsx
'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';

interface DecorColors {
  bg: string;
  surface: string;
  accent: string;
  primary: string;
  dark: string;
}

interface CoverProps {
  groomName: string;
  brideName: string;
  guestName?: string;
  coverText?: string;
  bg?: string;
  accent?: string;
  textColor?: string;
  HeroDecor?: FC<{ colors: DecorColors }>;
  decorColors?: DecorColors;
  onOpen: () => void;
}

export default function Cover({
  groomName,
  brideName,
  guestName,
  coverText,
  bg = '#6B1020',
  accent = '#C8A84B',
  textColor = 'rgba(245,237,224,0.85)',
  HeroDecor,
  decorColors,
  onOpen,
}: CoverProps) {
  const label = coverText || 'Kepada Yth.';
  const g0 = groomName.trim()[0]?.toUpperCase() || 'B';
  const b0 = brideName.trim()[0]?.toUpperCase() || 'S';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ backgroundColor: bg, cursor: 'pointer' }}
      onClick={onOpen}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
    >
      {HeroDecor && decorColors && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <HeroDecor colors={decorColors} />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center relative z-10"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: accent }}>
          {label}
        </p>
        <p className="text-sm mb-10" style={{ color: textColor }}>
          {guestName || 'Tamu Undangan'}
        </p>

        {/* Envelope */}
        <div
          className="relative w-72 h-48 rounded-xl flex flex-col items-center justify-center mb-10"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
          }}
        >
          {/* Heart seal */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 z-10"
            style={{ backgroundColor: accent }}
          >
            <span className="text-2xl" style={{ color: bg }}>♥</span>
          </div>

          {/* Monogram */}
          <p className="font-heading text-xl italic z-10" style={{ color: accent }}>
            {g0} &amp; {b0}
          </p>
        </div>

        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs tracking-widest"
          style={{ color: textColor }}
        >
          Sentuh untuk membuka undangan
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
```

(Note: the old V-flap triangle div is intentionally dropped — it relied on a hardcoded translucent white that breaks on light backgrounds; the seal + monogram + border read cleanly on both light and dark themes.)

- [ ] **Step 2: Pass theme props to `Cover` from `page.tsx`**

In `apps/invitation/src/app/[slug]/page.tsx`, find the `<Cover ... />` element inside the `hasSections` branch and replace it with:

```tsx
                  <Cover
                    key="cover-overlay"
                    groomName={invitation.groomName}
                    brideName={invitation.brideName}
                    guestName={guest?.invitationName}
                    coverText={coverSection.data.coverText}
                    bg={templateConfig?.stylePresets?.['dark']?.bg}
                    accent={templateConfig?.config?.accentColor}
                    textColor={templateConfig?.stylePresets?.['dark']?.text}
                    HeroDecor={decorConfig.HeroDecor}
                    decorColors={decorConfig.colors}
                    onOpen={() => setIsOpen(true)}
                  />
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/components/Cover.tsx apps/invitation/src/app/[slug]/page.tsx
git commit -m "refactor(invitation): make Cover theme-aware with optional decoration"
```

---

## Task 9: Admin — `decorationStyle` field on the template editor

**Context:** `apps/web/.../templates/[id]/page.tsx` has no `decorationStyle` control, and its `AVAILABLE_COMPONENTS` list (for default sections) omits `cover` and `dress-code`. Add both.

**Files:**
- Modify: `apps/web/src/app/(dashboard)/templates/[id]/page.tsx`

- [ ] **Step 1: Add `cover` and `dress-code` to `AVAILABLE_COMPONENTS`**

In `apps/web/src/app/(dashboard)/templates/[id]/page.tsx`, replace the `AVAILABLE_COMPONENTS` constant with:

```typescript
const AVAILABLE_COMPONENTS = [
  { id: 'cover', label: 'Cover / Opening' },
  { id: 'couple-profile', label: 'Couple Profile' },
  { id: 'event-detail', label: 'Event Detail' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'donation', label: 'Donation / Gift' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'wishes', label: 'Wishes' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'story', label: 'Our Story' },
  { id: 'location-map', label: 'Location Map' },
  { id: 'dress-code', label: 'Dress Code' },
];
```

- [ ] **Step 2: Add a `DECORATION_STYLES` constant**

Add this constant right after `AVAILABLE_COMPONENTS`:

```typescript
const DECORATION_STYLES = ['none', 'jawa', 'bali', 'sunda', 'minang', 'betawi', 'batak', 'floral'];
```

- [ ] **Step 3: Add `decorationStyle` to the `TemplateData` interface and form state**

In the `TemplateData` interface, add `decorationStyle: string;`. Then change the `form` state initializer to include it:

```typescript
  const [form, setForm] = useState({ name: '', slug: '', description: '', thumbnail: '', isActive: true, decorationStyle: 'none' });
```

In the `useEffect` that loads the template, update the `setForm` call to include `decorationStyle`:

```typescript
        setForm({ name: t.name, slug: t.slug, description: t.description || '', thumbnail: t.thumbnail || '', isActive: t.isActive, decorationStyle: t.decorationStyle || 'none' });
```

- [ ] **Step 4: Add a `decorationStyle` select to the Basic Info card**

In the Basic Info card's grid, add this field after the Thumbnail URL field block:

```tsx
            <div className="space-y-1.5">
              <Label>Decoration Style</Label>
              <Select value={form.decorationStyle} onValueChange={(v) => setForm({ ...form, decorationStyle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DECORATION_STYLES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
```

(`Select` and friends are already imported in this file. `handleSave` already sends `{ ...form, config, defaultSections, stylePresets }`, so `decorationStyle` is included automatically once it is part of `form`.)

- [ ] **Step 5: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/src/app/(dashboard)/templates/[id]/page.tsx"
git commit -m "feat(web): add decorationStyle field to template editor"
```

---

## Task 10: Seed the Floral Watercolor template

**Files:**
- Create: `server/src/scripts/seed-floral-template.ts`

- [ ] **Step 1: Create the template seed**

Create `server/src/scripts/seed-floral-template.ts` with this exact content:

```typescript
// Run: npx tsx server/src/scripts/seed-floral-template.ts
// Creates/updates the "Floral Watercolor" template.

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Template } from '../models/Template';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

const templateData = {
  name: 'Floral Watercolor',
  slug: 'floral-watercolor',
  decorationStyle: 'floral',
  description: 'Tema floral lembut dengan ornamen bunga vektor, krem dan pink',
  isActive: true,
  config: {
    primaryColor: '#C9477E',
    secondaryColor: '#F7F3EE',
    accentColor: '#D98FA8',
    fontHeading: 'Pinyon Script',
    fontBody: 'Poppins',
    heroTitle: 'The Wedding of',
    heroSubtitle: 'A small celebration in the island full of memories',
    bodyGreeting: '',
    footerTitle: 'Thank You',
    footerMessage: 'We are truly grateful for your heartfelt wishes and prayers for our marriage.',
  },
  defaultSections: [
    { componentId: 'cover', style: 'light', order: 0 },
    { componentId: 'couple-profile', style: 'light', order: 1 },
    { componentId: 'gallery', style: 'light', order: 2 },
    { componentId: 'location-map', style: 'light', order: 3 },
    { componentId: 'event-detail', style: 'light', order: 4 },
    { componentId: 'dress-code', style: 'light', order: 5 },
    { componentId: 'rsvp', style: 'accent', order: 6 },
    { componentId: 'donation', style: 'light', order: 7 },
    { componentId: 'wishes', style: 'accent', order: 8 },
  ],
  stylePresets: {
    light: { bg: '#F7F3EE', text: '#6E6258' },
    dark: { bg: '#F0E3DC', text: '#8A5A72' },
    accent: { bg: '#D98FA8', text: '#FFFFFF' },
    'image-1': { bg: '#F2E7DF', text: '#6E6258' },
    'image-2': { bg: '#EADED4', text: '#6E6258' },
  },
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const template = await Template.findOneAndUpdate(
    { slug: templateData.slug },
    { $set: templateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Template "${template.name}" upserted (${template._id})`);
  console.log(`decorationStyle persisted: ${template.decorationStyle}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Run the seed and confirm `decorationStyle` persists**

Ensure MongoDB is running (`docker-compose up -d` if needed), then run:

`npx tsx server/src/scripts/seed-floral-template.ts`

Expected output includes:
```
Template "Floral Watercolor" upserted (<id>)
decorationStyle persisted: floral
```
If it prints `decorationStyle persisted: none` or `undefined`, Task 1 was not applied correctly — fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add server/src/scripts/seed-floral-template.ts
git commit -m "feat(server): add Floral Watercolor template seed"
```

---

## Task 11: Seed Dega & Lauditta data + copy photos

**Context:** Rewrite `seed-dega-lauditta.ts` with the real Canva data on the floral template. The 8 couple photos live in `dega-dita-asets/` at the repo root; copy them into the invitation app's public folder so they are served at `/assets/dega-lauditta/...`.

**Files:**
- Create: `apps/invitation/public/assets/dega-lauditta/1.png` … `8.jpg` (copied)
- Modify: `server/src/scripts/seed-dega-lauditta.ts` (full rewrite)

- [ ] **Step 1: Copy the photos into the invitation public folder**

Run (PowerShell):

```powershell
New-Item -ItemType Directory -Force "apps/invitation/public/assets/dega-lauditta"
Copy-Item "dega-dita-asets/*" "apps/invitation/public/assets/dega-lauditta/"
```

Confirm 8 files exist:

```powershell
Get-ChildItem "apps/invitation/public/assets/dega-lauditta"
```

Expected: `1.png`, `2.jpg`, `3.jpg`, `4.jpg`, `5.jpg`, `6.jpg`, `7.jpg`, `8.jpg`.

- [ ] **Step 2: Rewrite the Dega & Lauditta seed**

Replace the entire contents of `server/src/scripts/seed-dega-lauditta.ts` with:

```typescript
// Run: npx tsx server/src/scripts/seed-dega-lauditta.ts
// Seeds client Dega & Lauditta on the Floral Watercolor template.
// Requires: seed-floral-template.ts has been run first.

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Template } from '../models/Template';
import { Client } from '../models/Client';
import { Guest } from '../models/Guest';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

// Photos are served by the invitation app from apps/invitation/public.
const P = '/assets/dega-lauditta';
const heroPhoto = `${P}/1.png`;
const galleryImages = [
  `${P}/2.jpg`, `${P}/3.jpg`, `${P}/4.jpg`, `${P}/5.jpg`,
  `${P}/6.jpg`, `${P}/7.jpg`, `${P}/8.jpg`,
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ email: 'admin@wedding.dev' });
  if (!user) {
    user = await User.create({
      email: 'admin@wedding.dev',
      password: 'password123',
      name: 'Admin',
      role: 'admin',
    });
    console.log('Created admin user');
  }

  const template = await Template.findOne({ slug: 'floral-watercolor' });
  if (!template) {
    console.error('Template "floral-watercolor" not found. Run seed-floral-template.ts first.');
    process.exit(1);
  }
  console.log(`Using template: ${template.name}`);

  const eventDate = '2026-07-26';

  const events = [
    {
      name: 'Welcome Cocktail',
      date: eventDate,
      time: '17:00 - 18:00 WITA',
      venue: '',
      address: '',
      mapUrl: '',
    },
    {
      name: 'Dinner Reception',
      date: eventDate,
      time: '18:00 - 22:00 WITA',
      venue: '',
      address: '',
      mapUrl: '',
    },
  ];

  const bankAccounts = [
    { bank: 'BCA', accountNumber: '6044015492', accountName: 'Lauditta Soraya Librata' },
  ];

  const clientData = {
    userId: user._id,
    groomName: 'Dega',
    brideName: 'Lauditta',
    groomPhoto: galleryImages[0],
    bridePhoto: galleryImages[3],
    groomParents: { father: 'Bapak Taufikh (Alm.)', mother: 'Ibu Sri Mujiastuti' },
    brideParents: { father: 'Bapak Johan Librata (Alm.)', mother: 'Ibu Nina Krisnawati' },
    eventDate: new Date(eventDate),
    events,
    templateId: template._id,
    slug: 'dega-lauditta',
    venue: 'Hilton Garden Inn Bali, Nusa Dua',
    music: {
      videoId: 'dt25SFw8H4Y',
      autoplay: true,
    },
    bankAccounts,
    customContent: {
      heroTitle: 'The Wedding of',
      heroSubtitle: 'A small celebration in the island full of memories',
      bodyGreeting: '',
      footerTitle: 'Thank You',
      footerMessage: 'We are truly grateful for your heartfelt wishes and prayers for our marriage.',
      heroPhoto,
    },
    sections: [
      {
        id: 's-cover',
        componentId: 'cover',
        data: { coverText: 'Kepada Yth.' },
        style: 'light',
        order: 0,
      },
      {
        id: 's-couple',
        componentId: 'couple-profile',
        data: {
          groomName: 'Dega Aprillian',
          brideName: 'Lauditta Soraya Librata',
          groomPhoto: galleryImages[0],
          bridePhoto: galleryImages[3],
          groomParents: { father: 'Bapak Taufikh (Alm.)', mother: 'Ibu Sri Mujiastuti' },
          brideParents: { father: 'Bapak Johan Librata (Alm.)', mother: 'Ibu Nina Krisnawati' },
          accentMotif: 'hearts',
        },
        style: 'light',
        order: 1,
      },
      {
        id: 's-gallery',
        componentId: 'gallery',
        data: { images: galleryImages, layout: 'carousel' },
        style: 'light',
        order: 2,
      },
      {
        id: 's-location',
        componentId: 'location-map',
        data: {
          venue: 'Hilton Garden Inn Bali, Nusa Dua',
          address: 'Kawasan Pariwisata Nusa Dua, Bali',
          mapUrl: 'https://maps.app.goo.gl/zbFwMh3ebLwUfrMe7',
          accentMotif: 'sprig',
        },
        style: 'light',
        order: 3,
      },
      {
        id: 's-itinerary',
        componentId: 'event-detail',
        data: { events },
        style: 'light',
        order: 4,
      },
      {
        id: 's-dresscode',
        componentId: 'dress-code',
        data: {
          note: '',
          groups: [
            { label: 'Gentlemen', description: 'Earth tone', figure: 'gentlemen' },
            { label: 'Ladies', description: 'The shades of flowers, except white flowers', figure: 'ladies' },
          ],
        },
        style: 'light',
        order: 5,
      },
      {
        id: 's-rsvp',
        componentId: 'rsvp',
        data: {},
        style: 'accent',
        order: 6,
      },
      {
        id: 's-donation',
        componentId: 'donation',
        data: { bankAccounts, accentMotif: 'bloom' },
        style: 'light',
        order: 7,
      },
      {
        id: 's-wishes',
        componentId: 'wishes',
        data: {},
        style: 'accent',
        order: 8,
      },
    ],
    status: 'published',
  };

  const client = await Client.findOneAndUpdate(
    { slug: 'dega-lauditta' },
    { $set: clientData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Client "${client.groomName} & ${client.brideName}" upserted (${client._id})`);

  const guestData = [
    { name: 'Wayan Sudana', invitationName: 'Bapak & Ibu Wayan Sudana', slug: 'wayan-sudana', phone: '081234500001', category: 'family' as const },
    { name: 'Komang Ayu', invitationName: 'Komang Ayu & Keluarga', slug: 'komang-ayu', phone: '081234500002', category: 'friend' as const },
    { name: 'Ahmad Rizki', invitationName: 'Ahmad Rizki & Pasangan', slug: 'ahmad-rizki', phone: '081234500003', category: 'officeFriend' as const },
  ];

  let guestCount = 0;
  for (const g of guestData) {
    await Guest.findOneAndUpdate(
      { clientId: client._id, slug: g.slug },
      { $set: { ...g, clientId: client._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    guestCount++;
  }
  console.log(`${guestCount} guests upserted`);

  console.log('\n--- Dega & Lauditta Seed Complete ---');
  console.log(`Template:    ${template.name} (${template.slug})`);
  console.log(`Invitation:  http://localhost:3001/${client.slug}`);
  console.log(`With guest:  http://localhost:3001/${client.slug}?to=wayan-sudana`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Run the seed**

Run: `npx tsx server/src/scripts/seed-dega-lauditta.ts`
Expected: ends with `--- Dega & Lauditta Seed Complete ---` and no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/invitation/public/assets/dega-lauditta server/src/scripts/seed-dega-lauditta.ts
git commit -m "feat(server): seed Dega & Lauditta on Floral Watercolor template"
```

---

## Task 12: Full manual verification

**Context:** No automated tests exist; this task verifies the whole feature end-to-end in the browser.

**Files:** none (verification only)

- [ ] **Step 1: Start the stack**

Ensure MongoDB is up (`docker-compose up -d`), then run `npm run dev`. Wait for web:3000, invitation:3001, server:5000 to be ready.

- [ ] **Step 2: Verify the invitation renders**

Open `http://localhost:3001/dega-lauditta`. Confirm:
- The **Cover** overlay appears with a cream/floral background, pink monogram "D & L", and floral SVG decoration. Click it to open.
- The **Hero** shows the cut-out couple photo (`1.png`) in an arched frame, names in the Pinyon Script font, and the date.
- Floral SVG decoration appears along section edges.
- Sections render in order: Couple Profile, Gallery, Location/Venue, Itinerary (event-detail), Dress Code, RSVP, Donation, Wishes.
- The **Dress Code** section shows two SVG silhouettes (Gentlemen / Ladies) with labels.
- The **Itinerary** (event-detail) cards are readable on the light background and show no empty "Tempat" block.
- The floating music player appears and plays the YouTube track after opening.
- Accent motifs appear above the Couple, Location, and Donation sections.

- [ ] **Step 3: Verify guest personalization**

Open `http://localhost:3001/dega-lauditta?to=wayan-sudana`. Confirm the Cover shows the guest name and the RSVP section appears.

- [ ] **Step 4: Regression-check a Nusantara template**

If a Nusantara client exists (e.g. seed one via `npx tsx server/src/scripts/seed-nusantara.ts` + an existing client), open its invitation and confirm the dark `event-detail` cards and the Cover still render correctly (the theme-aware refactors of Tasks 7 & 8 must not break dark templates).

- [ ] **Step 5: Verify the admin template editor**

Open `http://localhost:3000`, log in (`admin@wedding.dev` / `password123`), go to Templates → Floral Watercolor. Confirm the **Decoration Style** select shows `floral`. Change nothing or re-save; confirm no error.

- [ ] **Step 6: Final type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit any verification fixes**

If Steps 2–5 surfaced bugs, fix them, re-run `npm run lint`, and commit with a descriptive message. If everything passed, no commit is needed.

---

## Self-Review Notes

- **Spec coverage:** Item 0 → Task 1; Item 1 → Task 10; Item 2 → Task 3; Item 3 → Tasks 2 & 4; Item 4 → Task 6 (admin editor descoped — see Conventions); Item 5 → Task 7; Item 6 → Task 5; Item 7 → Task 11; Item 8 → Task 9; Item 9 (Cover) → Task 8. Verification (§10) → Task 12.
- **`figure` field in an array:** the admin section form renders array sub-fields as plain text inputs, so `figure` is a `text` field — the editor types `gentlemen`/`ladies`. The `DressCode` component maps the string to a silhouette. This is intentional given the current form generator.
- **Photo paths** are root-relative (`/assets/dega-lauditta/...`) and resolve against the invitation app origin (port 3001), which serves its own `public/` folder.
