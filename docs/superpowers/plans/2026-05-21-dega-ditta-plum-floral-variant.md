# dega-ditta Plum/Mauve Floral Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a second invitation `/dega-ditta` — a plum/mauve restyle of the existing `/dega-lauditta` with new photos and a tinted floral decoration variant — without altering the existing invitation.

**Architecture:** Additive only. A new `floral-plum` decoration module (color-swapped clone of `floral`) registered in the decoration registry; a new `floral-watercolor-plum` Template seed; a new `dega-ditta` Client seed cloning dega-lauditta's data; copied web assets. One backward-compatible tweak to the shared `LocationMap` button. No model/renderer/page changes.

**Tech Stack:** Next.js 14 (App Router, invitation app on :3001), Express + Mongoose (server on :5000), MongoDB (Docker), `tsx` for seed scripts, TypeScript. No test framework — `npm run lint` (tsc) is the verification gate.

**Spec:** `docs/superpowers/specs/2026-05-21-dega-ditta-plum-floral-variant-design.md`

---

## File Structure

- Create: `apps/invitation/src/lib/decorations/floral-plum/index.tsx` — plum-tinted decoration module (blooms/sprigs/strips + `floralPlumColors`).
- Modify: `apps/invitation/src/lib/decorations/registry.ts` — register `floral-plum`.
- Modify: `apps/invitation/src/components/sections/LocationMap.tsx` — button prefers `mapUrl`.
- Create: `server/src/scripts/seed-floral-plum-template.ts` — `floral-watercolor-plum` template.
- Create: `server/src/scripts/seed-dega-ditta.ts` — `dega-ditta` client + guests.
- Create: `apps/invitation/public/assets/dega-ditta/` — `couple.png` + `2.jpg`…`8.jpg`.

---

## Task 1: Copy web assets for dega-ditta

**Files:**
- Create: `apps/invitation/public/assets/dega-ditta/couple.png` (from `dega-dita-asets2/1.png`)
- Create: `apps/invitation/public/assets/dega-ditta/2.jpg` … `8.jpg` (from `dega-dita-asets2/2.jpg` … `8.jpg`)

Source folder `dega-dita-asets2/` is untracked at the repo root. We deliberately exclude `9.png`/`10.png` (hi-res dupes), `11.png` (name logotype — Hero renders names as text), `12.png`/`13.png` (Canva-stock cupids), and `attachments.zip`.

- [ ] **Step 1: Create the asset directory**

PowerShell:
```powershell
New-Item -ItemType Directory -Force "D:\CV\apps\wedding-invitation-platform\apps\invitation\public\assets\dega-ditta" | Out-Null
```

- [ ] **Step 2: Copy the couple illustration as couple.png**

PowerShell:
```powershell
Copy-Item "D:\CV\apps\wedding-invitation-platform\dega-dita-asets2\1.png" `
  "D:\CV\apps\wedding-invitation-platform\apps\invitation\public\assets\dega-ditta\couple.png" -Force
```

- [ ] **Step 3: Copy the seven gallery jpgs (2–8)**

PowerShell:
```powershell
2..8 | ForEach-Object {
  Copy-Item "D:\CV\apps\wedding-invitation-platform\dega-dita-asets2\$_.jpg" `
    "D:\CV\apps\wedding-invitation-platform\apps\invitation\public\assets\dega-ditta\$_.jpg" -Force
}
```

- [ ] **Step 4: Verify 8 files exist**

PowerShell:
```powershell
Get-ChildItem "D:\CV\apps\wedding-invitation-platform\apps\invitation\public\assets\dega-ditta" | Select-Object Name
```
Expected: `couple.png`, `2.jpg`, `3.jpg`, `4.jpg`, `5.jpg`, `6.jpg`, `7.jpg`, `8.jpg` (8 files).

- [ ] **Step 5: Commit**

```bash
git add apps/invitation/public/assets/dega-ditta
git commit -m "assets(dega-ditta): couple illustration + gallery photos"
```

---

## Task 2: Create the floral-plum decoration module

**Files:**
- Create: `apps/invitation/src/lib/decorations/floral-plum/index.tsx`

This is a color-swapped clone of `apps/invitation/src/lib/decorations/floral/index.tsx`. Shapes are identical; only `floralPlumColors`, `BLOOM`, `BLOOM_ALT`, `LEAF` differ. Type imports use the same relative depth (`../types`).

- [ ] **Step 1: Write the full module**

Create `apps/invitation/src/lib/decorations/floral-plum/index.tsx` with exactly:

```tsx
'use client';

import type { CSSProperties } from 'react';
import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const floralPlumColors: DecorColors = {
  bg: '#f5f3eb',
  surface: '#FFFFFF',
  accent: '#ba6193',
  primary: '#823460',
  dark: '#d9d5c7',
};

// Internal palette — flowers/leaves use more than one accent colour.
const BLOOM = '#c989ae';
const BLOOM_ALT = '#ba6193';
const LEAF = '#d9d5c7';

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
// On mobile the corners are scaled down so they don't overlap the centered content.
export function HeroDecor(_props: DecorProps) {
  const corner = (style: CSSProperties, extra: string) => (
    <div
      className="absolute w-[90px] h-[90px] sm:w-[150px] sm:h-[150px]"
      style={{ ...style }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 150 150"
        style={{ transform: extra }}
      >
        <g transform="translate(40,140)" opacity={0.55}>
          <Sprig size={90} />
          <g transform="translate(60,-10)"><Sprig size={60} /></g>
        </g>
      </svg>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {corner({ top: 0, left: 0 }, 'none')}
      {corner({ top: 0, right: 0 }, 'scaleX(-1)')}
      {corner({ bottom: 0, left: 0 }, 'scaleY(-1)')}
      {corner({ bottom: 0, right: 0 }, 'scale(-1,-1)')}
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

- [ ] **Step 2: Type-check the invitation app**

Run: `npm run lint`
Expected: PASS (no new TypeScript errors). The module is not yet imported anywhere, so this only confirms it compiles in isolation.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/lib/decorations/floral-plum/index.tsx
git commit -m "feat(invitation): add floral-plum decoration module"
```

---

## Task 3: Register floral-plum in the decoration registry

**Files:**
- Modify: `apps/invitation/src/lib/decorations/registry.ts`

- [ ] **Step 1: Add the import**

In `apps/invitation/src/lib/decorations/registry.ts`, immediately after the existing line:

```ts
import { HeroDecor as FloralHeroDecor, SectionDecor as FloralSectionDecor, FooterDecor as FloralFooterDecor, floralColors } from './floral';
```

add:

```ts
import { HeroDecor as FloralPlumHeroDecor, SectionDecor as FloralPlumSectionDecor, FooterDecor as FloralPlumFooterDecor, floralPlumColors } from './floral-plum';
```

- [ ] **Step 2: Add the registry entry**

In the same file, inside the `DECORATION_REGISTRY` object, immediately after the closing `},` of the `floral:` entry (the last entry before the final `};`), add:

```ts
  'floral-plum': {
    colors: floralPlumColors,
    HeroDecor: FloralPlumHeroDecor,
    SectionDecor: FloralPlumSectionDecor,
    FooterDecor: FloralPlumFooterDecor,
  },
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/lib/decorations/registry.ts
git commit -m "feat(invitation): register floral-plum decoration style"
```

---

## Task 4: Make LocationMap button prefer mapUrl

**Files:**
- Modify: `apps/invitation/src/components/sections/LocationMap.tsx`

Backward-compatible: the iframe logic is untouched; only the button link prefers `mapUrl` when present.

- [ ] **Step 1: Replace the mapsLink definition**

In `apps/invitation/src/components/sections/LocationMap.tsx`, replace:

```ts
  const mapsLink = address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : 'https://maps.google.com';
```

with:

```ts
  const mapsLink = mapUrl
    ? mapUrl
    : address
      ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
      : 'https://maps.google.com';
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/LocationMap.tsx
git commit -m "feat(invitation): LocationMap button opens mapUrl when provided"
```

---

## Task 5: Create the floral-watercolor-plum template seed

**Files:**
- Create: `server/src/scripts/seed-floral-plum-template.ts`

Clone of `server/src/scripts/seed-floral-template.ts` with the plum palette, new name/slug, and `decorationStyle: 'floral-plum'`.

- [ ] **Step 1: Write the seed script**

Create `server/src/scripts/seed-floral-plum-template.ts` with exactly:

```ts
// Run: npx tsx server/src/scripts/seed-floral-plum-template.ts
// Creates/updates the "Floral Watercolor — Plum" template.

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Template } from '../models/Template';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

const templateData = {
  name: 'Floral Watercolor — Plum',
  slug: 'floral-watercolor-plum',
  decorationStyle: 'floral-plum',
  description: 'Tema floral lembut dengan ornamen bunga vektor, krem dan plum-mauve',
  isActive: true,
  config: {
    primaryColor: '#823460',
    secondaryColor: '#f5f3eb',
    accentColor: '#ba6193',
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
    light: { bg: '#f5f3eb', text: '#6E5A60' },
    dark: { bg: '#823460', text: '#f5f3eb' },
    accent: { bg: '#ba6193', text: '#FFFFFF' },
    'image-1': { bg: '#EFEAE0', text: '#6E5A60' },
    'image-2': { bg: '#E7E1D2', text: '#6E5A60' },
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

- [ ] **Step 2: Type-check the server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Run the seed (Docker MongoDB must be up: `docker-compose up -d`)**

Run: `npx tsx server/src/scripts/seed-floral-plum-template.ts`
Expected output includes: `Template "Floral Watercolor — Plum" upserted (<id>)` and `decorationStyle persisted: floral-plum`.

- [ ] **Step 4: Commit**

```bash
git add server/src/scripts/seed-floral-plum-template.ts
git commit -m "feat(seed): floral-watercolor-plum template"
```

---

## Task 6: Create the dega-ditta client seed

**Files:**
- Create: `server/src/scripts/seed-dega-ditta.ts`

Clone of `server/src/scripts/seed-dega-lauditta.ts`. Reuses parents, events, bank, music, and the 8 sections; changes slug, names, template, photos, and the precise location.

- [ ] **Step 1: Write the seed script**

Create `server/src/scripts/seed-dega-ditta.ts` with exactly:

```ts
// Run: npx tsx server/src/scripts/seed-dega-ditta.ts
// Seeds client Dega & Ditta (plum variant of the same wedding) on the
// Floral Watercolor — Plum template.
// Requires: seed-floral-plum-template.ts has been run first.

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
const P = '/assets/dega-ditta';
const heroPhoto = `${P}/couple.png`;
const galleryImages = [
  `${P}/2.jpg`, `${P}/3.jpg`, `${P}/4.jpg`, `${P}/5.jpg`,
  `${P}/6.jpg`, `${P}/7.jpg`, `${P}/8.jpg`,
];

const mapUrl = 'https://www.google.com/maps/place/Hilton+Garden+Inn+Bali+Nusa+Dua,+Jl.+Pratama+No.57A,+Tanjung,+Benoa,+South+Kuta,+Badung+Regency,+Bali+80361/data=!4m2!3m1!1s0x2dd243a86595d7c9:0xaaf726486ec6ba56!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189&skid=7bc97085-e063-4bcc-8d12-721072ca4456';

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

  const template = await Template.findOne({ slug: 'floral-watercolor-plum' });
  if (!template) {
    console.error('Template "floral-watercolor-plum" not found. Run seed-floral-plum-template.ts first.');
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
    brideName: 'Ditta',
    groomPhoto: galleryImages[0],
    bridePhoto: galleryImages[3],
    groomParents: { father: 'Bapak Taufikh (Alm.)', mother: 'Ibu Sri Mujiastuti' },
    brideParents: { father: 'Bapak Johan Librata (Alm.)', mother: 'Ibu Nina Krisnawati' },
    eventDate: new Date(eventDate),
    events,
    templateId: template._id,
    slug: 'dega-ditta',
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
        data: { images: galleryImages, layout: 'grid' },
        style: 'light',
        order: 2,
      },
      {
        id: 's-location',
        componentId: 'location-map',
        data: {
          venue: 'Hilton Garden Inn Bali, Nusa Dua',
          address: 'Jl. Pratama No.57A, Tanjung, Benoa, South Kuta, Badung Regency, Bali 80361',
          mapUrl,
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
        id: 's-wishes',
        componentId: 'wishes',
        data: {},
        style: 'accent',
        order: 7,
      },
    ],
    status: 'published',
  };

  const client = await Client.findOneAndUpdate(
    { slug: 'dega-ditta' },
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

  console.log('\n--- Dega & Ditta Seed Complete ---');
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

- [ ] **Step 2: Type-check the server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Run the seed (template seed from Task 5 must have run first)**

Run: `npx tsx server/src/scripts/seed-dega-ditta.ts`
Expected output includes: `Using template: Floral Watercolor — Plum`, `Client "Dega & Ditta" upserted (<id>)`, `3 guests upserted`, and the `Invitation: http://localhost:3001/dega-ditta` line.

- [ ] **Step 4: Commit**

```bash
git add server/src/scripts/seed-dega-ditta.ts
git commit -m "feat(seed): dega-ditta client (plum variant of dega-lauditta)"
```

---

## Task 7: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Ensure the dev stack is running**

If not already up:
```powershell
docker-compose up -d
npm run dev
```
Wait for `server:dev: Server started` and both Next apps `Ready`.

- [ ] **Step 2: Verify the API returns the plum invitation with 8 sections**

PowerShell:
```powershell
$ProgressPreference='SilentlyContinue'
$r = Invoke-RestMethod "http://localhost:5000/api/invitations/dega-ditta"
"sections: $($r.invitation.sections.Count)"
"decorationStyle: $($r.invitation.templateId.decorationStyle)"
"primary: $($r.invitation.templateId.config.primaryColor)"
```
Expected: `sections: 8`, `decorationStyle: floral-plum`, `primary: #823460`.

- [ ] **Step 3: Visually verify in the browser**

Open `http://localhost:3001/dega-ditta` (and `?to=wayan-sudana`). Confirm:
- Cover + Hero are deep plum (`#823460`) with cream names and the couple illustration.
- Floral corner sprigs/strips are mauve/sage (not the old pink).
- RSVP/Wishes sections have the mauve (`#ba6193`) background.
- Location section embeds Hilton Garden Inn Bali Nusa Dua, and "Buka di Google Maps" opens the exact place URL.

- [ ] **Step 4: Regression — dega-lauditta unchanged**

Open `http://localhost:3001/dega-lauditta`. Confirm it still renders in the original pink palette and all sections work.

- [ ] **Step 5: Final lint gate**

Run: `npm run lint`
Expected: PASS across all workspaces.

---

## Notes / follow-ups (out of scope)

- Solo portrait crops for the couple-profile (currently uses two gallery photos).
- Optionally render the `11.png` name logotype as a hero/cover image.
- An original (non-Canva) cherub motif if a cupid accent is later desired.
