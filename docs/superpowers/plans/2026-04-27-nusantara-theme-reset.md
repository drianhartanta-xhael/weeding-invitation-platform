# Nusantara Theme Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset semua template ke 1 template Nusantara (wine-red + cream + gold), redesign semua komponen invitation agar match referensi, tambah Cover dan cultural quotes.

**Architecture:** Slot-based section system dipertahankan. Cover ditambah sebagai section type khusus yang dirender sebagai full-screen overlay oleh page.tsx (bukan di dalam SectionRenderer). Visual setiap komponen didesign ulang menggunakan CSS variables `var(--wedding-primary/secondary/accent)` yang sudah diinjek dinamis oleh page.tsx dari template config.

**Tech Stack:** Next.js 14 App Router, Framer Motion, Tailwind CSS, TypeScript, Mongoose, tsx (server scripts)

---

## File Map

| File | Action | Keterangan |
|------|--------|-----------|
| `packages/shared/src/types/components.ts` | Modify | Tambah `cover`, `culturalQuotes` |
| `apps/invitation/src/components/Cover.tsx` | Create | Layar amplop animasi |
| `apps/invitation/src/components/sections/Hero.tsx` | Modify | Redesign wine-red, tambah `bodyGreeting`, `venue` |
| `apps/invitation/src/components/sections/Couple.tsx` | Modify | Redesign + cultural quotes panel |
| `apps/invitation/src/components/sections/Events.tsx` | Modify | Redesign dark theme, roman numerals |
| `apps/invitation/src/components/sections/Gallery.tsx` | Modify | Update heading + colors saja |
| `apps/invitation/src/components/sections/LocationMap.tsx` | Modify | Redesign visual |
| `apps/invitation/src/components/sections/RSVP.tsx` | Modify | Redesign dark form, Indonesian labels |
| `apps/invitation/src/components/sections/Gift.tsx` | Modify | Redesign visual (logic copy sudah ada) |
| `apps/invitation/src/components/sections/Wishes.tsx` | Modify | Redesign visual |
| `apps/invitation/src/components/sections/Footer.tsx` | Modify | Wine-red, NUSANTARA WEDDING, Qur'an verse, tambah `eventDate` |
| `apps/invitation/src/app/[slug]/page.tsx` | Modify | Cover overlay, bodyGreeting→Hero, venue→Hero, eventDate→Footer |
| `server/src/scripts/seed-nusantara-v2.ts` | Create | 1 template Nusantara, hapus template lama |
| `server/src/scripts/seed-mvp.ts` | Modify | Gunakan template `nusantara` |

---

## Task 1: Update Shared Component Types

**Files:**
- Modify: `packages/shared/src/types/components.ts`

- [ ] **Step 1: Replace entire file content**

```typescript
// packages/shared/src/types/components.ts

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
] as const;

export type ComponentId = (typeof COMPONENT_IDS)[number];

export interface CoverData {
  coverText?: string;
}

export interface CoupleProfileData {
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
  culturalQuotes?: { ethnic: string; quote: string }[];
}

export interface EventDetailData {
  events: {
    name: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  }[];
}

export interface GalleryData {
  images: string[];
}

export interface DonationData {
  bankAccounts: {
    bank: string;
    accountNumber: string;
    accountName: string;
  }[];
}

export interface RsvpData {}
export interface WishesData {}

export interface CountdownData {
  eventDate: string;
}

export interface StoryData {
  stories: {
    title: string;
    date: string;
    description: string;
    image: string;
  }[];
  layout?: 'vertical' | 'horizontal';
}

export interface LocationMapData {
  venue: string;
  address: string;
  mapUrl: string;
}

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
  | LocationMapData;

export const STYLE_PRESETS = ['light', 'dark', 'accent', 'image-1', 'image-2'] as const;
export type StylePreset = (typeof STYLE_PRESETS)[number];

export interface ISection {
  id: string;
  componentId: ComponentId;
  data: Record<string, any>;
  style: StylePreset;
  order: number;
}

export interface ComponentFieldOption {
  value: string;
  label: string;
}

export interface ComponentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'url' | 'array' | 'image-list' | 'select';
  required?: boolean;
  placeholder?: string;
  arrayFields?: ComponentField[];
  options?: ComponentFieldOption[];
}

export interface ComponentMeta {
  id: ComponentId;
  label: string;
  description: string;
  icon: string;
  fields: ComponentField[];
}

export const COMPONENT_REGISTRY: ComponentMeta[] = [
  {
    id: 'cover',
    label: 'Cover / Opening',
    description: 'Layar pembuka amplop animasi sebelum undangan dibuka',
    icon: 'mail',
    fields: [
      { key: 'coverText', label: 'Teks Pembuka', type: 'text', placeholder: 'Kepada Yth.' },
    ],
  },
  {
    id: 'couple-profile',
    label: 'Couple Profile',
    description: 'Display bride & groom info with photos, parents, and cultural quotes',
    icon: 'heart',
    fields: [
      { key: 'groomName', label: 'Groom Name', type: 'text', required: true },
      { key: 'brideName', label: 'Bride Name', type: 'text', required: true },
      { key: 'groomPhoto', label: 'Groom Photo URL', type: 'url' },
      { key: 'bridePhoto', label: 'Bride Photo URL', type: 'url' },
      {
        key: 'groomParents',
        label: 'Groom Parents',
        type: 'array',
        arrayFields: [
          { key: 'father', label: 'Father', type: 'text' },
          { key: 'mother', label: 'Mother', type: 'text' },
        ],
      },
      {
        key: 'brideParents',
        label: 'Bride Parents',
        type: 'array',
        arrayFields: [
          { key: 'father', label: 'Father', type: 'text' },
          { key: 'mother', label: 'Mother', type: 'text' },
        ],
      },
      {
        key: 'culturalQuotes',
        label: 'Kutipan Budaya',
        type: 'array',
        arrayFields: [
          { key: 'ethnic', label: 'Nama Suku/Budaya', type: 'text', placeholder: 'e.g. BETAWI' },
          { key: 'quote', label: 'Kutipan', type: 'text', placeholder: 'e.g. Ade mate niku asal ati' },
        ],
      },
    ],
  },
  {
    id: 'event-detail',
    label: 'Event Detail',
    description: 'Show event schedule with venue and map',
    icon: 'calendar',
    fields: [
      {
        key: 'events',
        label: 'Events',
        type: 'array',
        arrayFields: [
          { key: 'name', label: 'Event Name', type: 'text', required: true, placeholder: 'e.g. Akad Nikah' },
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'time', label: 'Time', type: 'text', required: true, placeholder: 'e.g. 08:00 - 10:00 WIB' },
          { key: 'venue', label: 'Venue', type: 'text', required: true },
          { key: 'address', label: 'Address', type: 'text', required: true },
          { key: 'mapUrl', label: 'Maps URL', type: 'url', placeholder: 'https://maps.google.com/...' },
        ],
      },
    ],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Photo gallery section',
    icon: 'image',
    fields: [{ key: 'images', label: 'Image URLs', type: 'image-list' }],
  },
  {
    id: 'donation',
    label: 'Donation / Gift',
    description: 'Bank accounts for digital gifts',
    icon: 'gift',
    fields: [
      {
        key: 'bankAccounts',
        label: 'Bank Accounts',
        type: 'array',
        arrayFields: [
          { key: 'bank', label: 'Bank', type: 'text', required: true, placeholder: 'e.g. BCA' },
          { key: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { key: 'accountName', label: 'Account Name', type: 'text', required: true },
        ],
      },
    ],
  },
  {
    id: 'rsvp',
    label: 'RSVP',
    description: 'Guest attendance confirmation form',
    icon: 'check-circle',
    fields: [],
  },
  {
    id: 'wishes',
    label: 'Wishes',
    description: 'Guest wishes and messages wall',
    icon: 'message-circle',
    fields: [],
  },
  {
    id: 'countdown',
    label: 'Countdown',
    description: 'Countdown timer to event date',
    icon: 'clock',
    fields: [{ key: 'eventDate', label: 'Event Date', type: 'date', required: true }],
  },
  {
    id: 'story',
    label: 'Our Story',
    description: 'Timeline of the couple story',
    icon: 'book-open',
    fields: [
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'vertical', label: 'Vertical' },
          { value: 'horizontal', label: 'Horizontal' },
        ],
      },
      {
        key: 'stories',
        label: 'Story Items',
        type: 'array',
        arrayFields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'date', label: 'Date', type: 'text', placeholder: 'e.g. January 2020' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'image', label: 'Image URL', type: 'url' },
        ],
      },
    ],
  },
  {
    id: 'location-map',
    label: 'Location Map',
    description: 'Embedded Google Maps with venue info',
    icon: 'map-pin',
    fields: [
      { key: 'venue', label: 'Venue Name', type: 'text', required: true },
      { key: 'address', label: 'Address', type: 'textarea', required: true },
      { key: 'mapUrl', label: 'Google Maps Embed URL (optional)', type: 'url', placeholder: 'https://www.google.com/maps/embed?...' },
    ],
  },
];

export function getComponentMeta(id: ComponentId): ComponentMeta | undefined {
  return COMPONENT_REGISTRY.find((c) => c.id === id);
}

const DEFAULT_CULTURAL_QUOTES = [
  { ethnic: 'BETAWI', quote: 'Ade mate niku asal ati' },
  { ethnic: 'SUNDA', quote: 'Silih asah, silih asih, silih asuh' },
  { ethnic: 'BATAK', quote: 'Haholongi ma donganmu' },
  { ethnic: 'BALI', quote: 'Menyama beraya' },
  { ethnic: 'PADANG', quote: 'Duduak surang basampik, duduak basamo balapang' },
];

export function getDefaultComponentData(id: ComponentId): Record<string, any> {
  switch (id) {
    case 'cover':
      return { coverText: '' };
    case 'couple-profile':
      return {
        groomName: '',
        brideName: '',
        groomPhoto: '',
        bridePhoto: '',
        groomParents: { father: '', mother: '' },
        brideParents: { father: '', mother: '' },
        culturalQuotes: DEFAULT_CULTURAL_QUOTES,
      };
    case 'event-detail':
      return { events: [] };
    case 'gallery':
      return { images: [] };
    case 'donation':
      return { bankAccounts: [] };
    case 'rsvp':
      return {};
    case 'wishes':
      return {};
    case 'countdown':
      return { eventDate: '' };
    case 'story':
      return { stories: [], layout: 'vertical' };
    case 'location-map':
      return { venue: '', address: '', mapUrl: '' };
    default:
      return {};
  }
}
```

- [ ] **Step 2: Type-check shared package**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/components.ts
git commit -m "feat: add cover component type and culturalQuotes to couple-profile"
```

---

## Task 2: Create Cover Component

**Files:**
- Create: `apps/invitation/src/components/Cover.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/invitation/src/components/Cover.tsx
'use client';

import { motion } from 'framer-motion';

interface CoverProps {
  groomName: string;
  brideName: string;
  guestName?: string;
  coverText?: string;
  bg?: string;
  onOpen: () => void;
}

export default function Cover({ groomName, brideName, guestName, coverText, bg = '#6B1020', onOpen }: CoverProps) {
  const label = coverText || 'Kepada Yth.';
  const g0 = groomName.trim()[0]?.toUpperCase() || 'B';
  const b0 = brideName.trim()[0]?.toUpperCase() || 'S';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
      style={{ backgroundColor: bg, cursor: 'pointer' }}
      onClick={onOpen}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: '#C8A84B' }}>
          {label}
        </p>
        <p className="text-sm mb-10" style={{ color: 'rgba(245,237,224,0.85)' }}>
          {guestName || 'Tamu Undangan'}
        </p>

        {/* Envelope */}
        <div
          className="relative w-72 h-48 rounded-xl flex flex-col items-center justify-center mb-10"
          style={{
            backgroundColor: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(200,168,75,0.25)',
          }}
        >
          {/* Envelope V-flap top */}
          <div
            className="absolute top-0 left-0 right-0 h-24 overflow-hidden"
            style={{ borderRadius: '12px 12px 0 0' }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '144px solid transparent',
                borderRight: '144px solid transparent',
                borderTop: '96px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          {/* Heart seal */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 z-10"
            style={{ backgroundColor: '#C8A84B' }}
          >
            <span className="text-2xl" style={{ color: '#6B1020' }}>♥</span>
          </div>

          {/* Monogram */}
          <p className="font-heading text-xl italic z-10" style={{ color: '#C8A84B' }}>
            {g0} &amp; {b0}
          </p>
        </div>

        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs tracking-widest"
          style={{ color: 'rgba(245,237,224,0.5)' }}
        >
          Sentuh untuk membuka undangan
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/Cover.tsx
git commit -m "feat: add Cover envelope animation component"
```

---

## Task 3: Redesign Hero

**Files:**
- Modify: `apps/invitation/src/components/sections/Hero.tsx`

- [ ] **Step 1: Replace file content**

```tsx
// apps/invitation/src/components/sections/Hero.tsx
'use client';

import { motion } from 'framer-motion';

interface HeroProps {
  groomName: string;
  brideName: string;
  eventDate: string;
  venue?: string;
  guestName?: string;
  heroTitle?: string;
  bodyGreeting?: string;
  decorConfig?: unknown; // kept for backwards compat, not used
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Hero({ groomName, brideName, eventDate, venue, guestName, heroTitle, bodyGreeting }: HeroProps) {
  const handleScroll = () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--wedding-primary, #6B1020)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center max-w-lg w-full"
      >
        {/* Opening label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs uppercase tracking-[0.25em] mb-6"
          style={{ color: 'var(--wedding-accent, #C8A84B)' }}
        >
          {heroTitle || 'The Wedding of'}
        </motion.p>

        {/* Bismillah / bodyGreeting */}
        {bodyGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 space-y-1"
          >
            {bodyGreeting.split('\n').map((line, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(245,237,224,0.75)' }}>
                {line}
              </p>
            ))}
          </motion.div>
        )}

        {/* Groom name */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="font-heading text-6xl md:text-8xl italic leading-none mb-1"
          style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}
        >
          {groomName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="font-heading text-3xl italic my-1"
          style={{ color: 'var(--wedding-accent, #C8A84B)' }}
        >
          &amp;
        </motion.p>

        {/* Bride name */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="font-heading text-6xl md:text-8xl italic leading-none mb-8"
          style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}
        >
          {brideName}
        </motion.h1>

        {/* Date + venue */}
        {eventDate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-sm"
            style={{ color: 'rgba(245,237,224,0.65)' }}
          >
            {formatDate(eventDate)}{venue ? ` · ${venue}` : ''}
          </motion.p>
        )}

        {/* Guest name */}
        {guestName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-4 text-xs tracking-widest"
            style={{ color: 'rgba(245,237,224,0.5)' }}
          >
            Kepada Yth. {guestName}
          </motion.p>
        )}
      </motion.div>

      {/* Scroll button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        onClick={handleScroll}
        className="absolute bottom-10 text-xs tracking-widest hover:opacity-80 transition-opacity"
        style={{ color: 'rgba(245,237,224,0.45)' }}
      >
        Gulir ↓
      </motion.button>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/Hero.tsx
git commit -m "feat: redesign Hero to Nusantara wine-red style"
```

---

## Task 4: Redesign Couple + Cultural Quotes

**Files:**
- Modify: `apps/invitation/src/components/sections/Couple.tsx`

- [ ] **Step 1: Replace file content**

```tsx
// apps/invitation/src/components/sections/Couple.tsx
'use client';

import { motion } from 'framer-motion';

interface CulturalQuote {
  ethnic: string;
  quote: string;
}

interface CoupleProps {
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
  culturalQuotes?: CulturalQuote[];
}

const fade = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7 },
};

export default function Couple({
  groomName, brideName, groomPhoto, bridePhoto,
  groomParents, brideParents, culturalQuotes,
}: CoupleProps) {
  return (
    <section className="py-20 px-4">
      {/* Section label + heading */}
      <motion.div {...fade} className="text-center mb-16">
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Mempelai
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Dua Insan, Satu Jiwa
        </h2>
      </motion.div>

      {/* Couple cards */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-center gap-6 mb-16">
        {/* Groom */}
        <motion.div {...fade} className="flex-1 text-center">
          <p className="text-xs tracking-[0.2em] uppercase mb-4 font-medium" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            Mempelai Pria
          </p>
          <div className="w-44 h-56 mx-auto mb-5 overflow-hidden rounded-lg bg-gray-100 border" style={{ borderColor: 'var(--wedding-accent, #C8A84B)' }}>
            {groomPhoto
              ? <img src={groomPhoto} alt={groomName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Foto</div>
            }
          </div>
          <h3 className="font-heading text-2xl italic mb-1" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
            {groomName}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(61,26,14,0.65)' }}>
            Putra dari{' '}
            <strong>{groomParents.father}</strong>{' '}
            &amp;{' '}
            <strong>{groomParents.mother}</strong>
          </p>
        </motion.div>

        {/* Ampersand */}
        <motion.div {...fade} className="self-center text-center py-4 md:py-12">
          <span className="font-heading text-5xl italic" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            &amp;
          </span>
        </motion.div>

        {/* Bride */}
        <motion.div {...fade} className="flex-1 text-center">
          <p className="text-xs tracking-[0.2em] uppercase mb-4 font-medium" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            Mempelai Wanita
          </p>
          <div className="w-44 h-56 mx-auto mb-5 overflow-hidden rounded-lg bg-gray-100 border" style={{ borderColor: 'var(--wedding-accent, #C8A84B)' }}>
            {bridePhoto
              ? <img src={bridePhoto} alt={brideName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Foto</div>
            }
          </div>
          <h3 className="font-heading text-2xl italic mb-1" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
            {brideName}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(61,26,14,0.65)' }}>
            Putri dari{' '}
            <strong>{brideParents.father}</strong>{' '}
            &amp;{' '}
            <strong>{brideParents.mother}</strong>
          </p>
        </motion.div>
      </div>

      {/* Cultural quotes */}
      {culturalQuotes && culturalQuotes.length > 0 && (
        <motion.div {...fade} className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {culturalQuotes.map((q, i) => (
              <div
                key={i}
                className="flex-1 min-w-[130px] max-w-[180px] text-center p-4 rounded-lg"
                style={{
                  border: '1px solid rgba(107,16,32,0.15)',
                  backgroundColor: 'rgba(200,168,75,0.05)',
                }}
              >
                <p className="text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {q.ethnic}
                </p>
                <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(61,26,14,0.65)' }}>
                  &ldquo;{q.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/Couple.tsx
git commit -m "feat: redesign Couple with cultural quotes panel"
```

---

## Task 5: Redesign Events

**Files:**
- Modify: `apps/invitation/src/components/sections/Events.tsx`

- [ ] **Step 1: Replace file content**

```tsx
// apps/invitation/src/components/sections/Events.tsx
'use client';

import { motion } from 'framer-motion';

interface Event {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
}

interface EventsProps {
  events: Event[];
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Events({ events }: EventsProps) {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
          Rangkaian Acara
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}>
          Hari Istimewa
        </h2>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-5">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 }}
            className="rounded-xl p-8"
            style={{
              backgroundColor: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(200,168,75,0.2)',
            }}
          >
            <p className="text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
              {ROMAN[index] || String(index + 1)} · {event.name}
            </p>

            <div className="space-y-3 text-sm" style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}>
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Tanggal</p>
                <p>{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Waktu</p>
                <p>{event.time}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Tempat</p>
                <p>{event.venue}</p>
                {event.address && <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{event.address}</p>}
              </div>
            </div>

            {event.mapUrl && (
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 px-5 py-2 text-xs tracking-widest uppercase rounded-full"
                style={{
                  backgroundColor: 'var(--wedding-accent, #C8A84B)',
                  color: '#3D1A0E',
                }}
              >
                Lihat Peta
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/Events.tsx
git commit -m "feat: redesign Events with roman numerals and dark theme"
```

---

## Task 6: Redesign Gallery

**Files:**
- Modify: `apps/invitation/src/components/sections/Gallery.tsx`

- [ ] **Step 1: Update section header only** — carousel logic dipertahankan, hanya heading yang diganti.

Replace baris heading dari:
```tsx
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl md:text-4xl text-center text-wedding-accent mb-12"
      >
        Our Gallery
      </motion.h2>
```

Menjadi:
```tsx
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Galeri
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Momen Berharga
        </h2>
      </motion.div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/Gallery.tsx
git commit -m "feat: update Gallery heading to Nusantara style"
```

---

## Task 7: Redesign LocationMap

**Files:**
- Modify: `apps/invitation/src/components/sections/LocationMap.tsx`

- [ ] **Step 1: Replace file content**

```tsx
// apps/invitation/src/components/sections/LocationMap.tsx
'use client';

import { motion } from 'framer-motion';

interface LocationMapProps {
  venue: string;
  address: string;
  mapUrl?: string;
}

export default function LocationMap({ venue, address, mapUrl }: LocationMapProps) {
  if (!venue && !address) return null;

  let embedSrc = '';
  if (mapUrl && mapUrl.includes('/maps/embed')) {
    embedSrc = mapUrl;
  } else if (address) {
    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const mapsLink = address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : 'https://maps.google.com';

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Lokasi
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          {venue || 'Lokasi Acara'}
        </h2>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(107,16,32,0.12)' }}
        >
          {/* Map */}
          {embedSrc && (
            <div className="w-full h-64">
              <iframe
                src={embedSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {/* Venue info */}
          <div className="p-6 text-center">
            {address && (
              <p className="text-sm mb-5" style={{ color: 'rgba(61,26,14,0.7)' }}>{address}</p>
            )}
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs tracking-widest uppercase"
              style={{
                backgroundColor: 'var(--wedding-primary, #6B1020)',
                color: '#F5EDE0',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Buka di Google Maps
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/LocationMap.tsx
git commit -m "feat: redesign LocationMap to Nusantara style"
```

---

## Task 8: Redesign RSVP

**Files:**
- Modify: `apps/invitation/src/components/sections/RSVP.tsx`

- [ ] **Step 1: Replace file content** — API logic dipertahankan, hanya visual yang berubah.

```tsx
// apps/invitation/src/components/sections/RSVP.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface RSVPProps {
  clientSlug: string;
  guestSlug?: string;
  currentStatus?: string;
}

export default function RSVP({ clientSlug, guestSlug, currentStatus }: RSVPProps) {
  const [rsvpStatus, setRsvpStatus] = useState(currentStatus || '');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestSlug || !rsvpStatus) return;
    setLoading(true);
    try {
      await api.post(`/guests/rsvp/${clientSlug}/${guestSlug}`, { rsvpStatus, numberOfGuests });
      setSubmitted(true);
    } catch {
      console.error('RSVP failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg text-sm outline-none";
  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(200,168,75,0.25)',
    color: 'var(--wedding-secondary, #F5EDE0)',
  };

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
          Konfirmasi Kehadiran
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}>
          RSVP
        </h2>
      </motion.div>

      <div className="max-w-md mx-auto">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <p className="font-heading text-2xl italic mb-3" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
              Terima Kasih
            </p>
            <p className="text-sm" style={{ color: 'rgba(245,237,224,0.7)' }}>
              Konfirmasi kehadiran Anda telah kami terima.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Attendance buttons */}
            <div>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(245,237,224,0.6)' }}>
                Konfirmasi Kehadiran
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'attending', label: 'Insya Allah Hadir 🎉' },
                  { value: 'notAttending', label: 'Mohon Maaf, Berhalangan' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRsvpStatus(opt.value)}
                    className="py-3 rounded-lg text-sm transition-all"
                    style={rsvpStatus === opt.value
                      ? { backgroundColor: 'var(--wedding-accent, #C8A84B)', color: '#3D1A0E' }
                      : { backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,168,75,0.2)', color: 'var(--wedding-secondary, #F5EDE0)' }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest count */}
            {rsvpStatus === 'attending' && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(245,237,224,0.6)' }}>
                  Jumlah Tamu
                </p>
                <select
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                  className={inputClass}
                  style={inputStyle}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n} style={{ backgroundColor: '#3D1A0E' }}>
                      {n} orang
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={!rsvpStatus || loading}
              className="w-full py-3 rounded-lg text-sm tracking-widest uppercase transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--wedding-accent, #C8A84B)', color: '#3D1A0E' }}
            >
              {loading ? 'Mengirim...' : 'Kirim Konfirmasi'}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/RSVP.tsx
git commit -m "feat: redesign RSVP with dark theme and Indonesian labels"
```

---

## Task 9: Redesign Gift

**Files:**
- Modify: `apps/invitation/src/components/sections/Gift.tsx`

- [ ] **Step 1: Replace file content** — copyToClipboard dan handlePayment logic dipertahankan.

```tsx
// apps/invitation/src/components/sections/Gift.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

interface GiftProps {
  clientId: string;
  bankAccounts: BankAccount[];
}

export default function Gift({ clientId, bankAccounts }: GiftProps) {
  const [guestName, setGuestName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const presetAmounts = [50000, 100000, 200000, 500000];

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !amount) return;
    setLoading(true);
    try {
      const { data } = await api.post('/gifts', { clientId, guestName, amount: Number(amount), message });
      if (data.snapToken && (window as any).snap) {
        (window as any).snap.pay(data.snapToken);
      } else if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      }
    } catch {
      console.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, bank: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(bank);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Hadiah
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic mb-3" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Amplop Digital
        </h2>
        <p className="text-sm max-w-sm mx-auto" style={{ color: 'rgba(61,26,14,0.65)' }}>
          Doa restu Anda adalah hadiah terbaik bagi kami.
        </p>
      </motion.div>

      <div className="max-w-lg mx-auto space-y-8">
        {/* Bank accounts */}
        {bankAccounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {bankAccounts.map((account) => (
              <div
                key={account.accountNumber}
                className="rounded-xl p-6 text-center"
                style={{
                  border: '1px solid rgba(107,16,32,0.15)',
                  backgroundColor: 'rgba(200,168,75,0.05)',
                }}
              >
                <p className="text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {account.bank}
                </p>
                <p className="font-mono text-lg font-bold mb-1" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {account.accountNumber}
                </p>
                <p className="text-xs mb-4" style={{ color: 'rgba(61,26,14,0.6)' }}>
                  a.n. {account.accountName}
                </p>
                <button
                  onClick={() => copyToClipboard(account.accountNumber, account.bank)}
                  className="px-5 py-2 rounded-full text-xs tracking-widest uppercase transition-all"
                  style={copied === account.bank
                    ? { backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }
                    : { border: '1px solid var(--wedding-primary, #6B1020)', color: 'var(--wedding-primary, #6B1020)' }
                  }
                >
                  {copied === account.bank ? 'Tersalin ✓' : 'Salin Nomor'}
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Digital payment */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handlePayment}
          className="rounded-xl p-6 space-y-4"
          style={{ border: '1px solid rgba(107,16,32,0.12)', backgroundColor: 'rgba(200,168,75,0.03)' }}
        >
          <h3 className="font-heading text-lg italic text-center mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
            Kirim Hadiah Digital
          </h3>
          <input
            type="text"
            placeholder="Nama Anda"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid rgba(107,16,32,0.2)', color: '#3D1A0E' }}
            required
          />
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={amount === String(preset)
                    ? { backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }
                    : { border: '1px solid rgba(107,16,32,0.25)', color: 'var(--wedding-primary, #6B1020)' }
                  }
                >
                  Rp {preset.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Nominal (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid rgba(107,16,32,0.2)', color: '#3D1A0E' }}
              min="1000"
              required
            />
          </div>
          <textarea
            placeholder="Pesan (opsional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ border: '1px solid rgba(107,16,32,0.2)', color: '#3D1A0E' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm tracking-widest uppercase transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }}
          >
            {loading ? 'Memproses...' : 'Kirim Hadiah'}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/Gift.tsx
git commit -m "feat: redesign Gift with Amplop Digital style"
```

---

## Task 10: Redesign Wishes

**Files:**
- Modify: `apps/invitation/src/components/sections/Wishes.tsx`

- [ ] **Step 1: Replace file content** — API logic dipertahankan.

```tsx
// apps/invitation/src/components/sections/Wishes.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface Wish {
  _id: string;
  guestName: string;
  message: string;
  createdAt: string;
}

interface WishesProps {
  clientId: string;
  initialWishes: Wish[];
}

export default function Wishes({ clientId, initialWishes }: WishesProps) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !message) return;
    setLoading(true);
    try {
      const { data } = await api.post('/wishes', { clientId, guestName, message });
      setWishes([data.wish, ...wishes]);
      setGuestName('');
      setMessage('');
    } catch {
      console.error('Failed to submit wish');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: '1px solid rgba(107,16,32,0.18)',
    color: '#3D1A0E',
    backgroundColor: 'white',
  };

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Pesan &amp; Doa
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Ucapan &amp; Doa
        </h2>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="rounded-xl p-6 mb-8 space-y-4"
          style={{ border: '1px solid rgba(107,16,32,0.12)', backgroundColor: 'rgba(200,168,75,0.04)' }}
        >
          <input
            type="text"
            placeholder="Nama Anda"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
            required
          />
          <textarea
            placeholder="Tulis ucapan dan doa Anda..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={inputStyle}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-full text-xs tracking-widest uppercase transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }}
          >
            {loading ? 'Mengirim...' : 'Kirim Ucapan 🌸'}
          </button>
        </motion.form>

        {/* Wishes list */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {wishes.map((wish, index) => (
            <motion.div
              key={wish._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-xl p-5"
              style={{ border: '1px solid rgba(107,16,32,0.1)', backgroundColor: 'rgba(200,168,75,0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {wish.guestName}
                </p>
              </div>
              <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(61,26,14,0.75)' }}>
                &ldquo;{wish.message}&rdquo;
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(61,26,14,0.4)' }}>
                {new Date(wish.createdAt).toLocaleDateString('id-ID')}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/Wishes.tsx
git commit -m "feat: redesign Wishes to Nusantara style"
```

---

## Task 11: Redesign Footer

**Files:**
- Modify: `apps/invitation/src/components/sections/Footer.tsx`

- [ ] **Step 1: Replace file content** — tambah `eventDate` prop, tambah QS. Ar-Rum branding.

```tsx
// apps/invitation/src/components/sections/Footer.tsx
'use client';

import { motion } from 'framer-motion';

interface FooterProps {
  groomName: string;
  brideName: string;
  eventDate?: string;
  footerTitle?: string;
  footerMessage?: string;
  decorConfig?: unknown; // kept for backwards compat, not used
}

function formatDateShort(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Footer({ groomName, brideName, eventDate, footerMessage }: FooterProps) {
  return (
    <footer
      className="py-16 px-4 text-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--wedding-primary, #6B1020)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-lg mx-auto"
      >
        {/* Branding */}
        <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
          Nusantara Wedding
        </p>

        {/* Couple names */}
        <h2 className="font-heading text-4xl md:text-5xl italic mb-2" style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}>
          {groomName} &amp; {brideName}
        </h2>

        {/* Date */}
        {eventDate && (
          <p className="text-sm mb-8" style={{ color: 'rgba(245,237,224,0.6)' }}>
            {formatDateShort(eventDate)}
          </p>
        )}

        {/* Divider */}
        <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: 'rgba(200,168,75,0.4)' }} />

        {/* Footer message or Qur'an verse */}
        {footerMessage ? (
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,237,224,0.65)' }}>
            {footerMessage}
          </p>
        ) : (
          <div>
            <p className="text-xs italic leading-relaxed mb-2" style={{ color: 'rgba(245,237,224,0.65)' }}>
              &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu
              isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya&rdquo;
            </p>
            <p className="text-xs tracking-widest" style={{ color: 'rgba(200,168,75,0.7)' }}>
              — QS. Ar-Rum : 21
            </p>
          </div>
        )}
      </motion.div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/components/sections/Footer.tsx
git commit -m "feat: redesign Footer with NUSANTARA WEDDING branding and Quran verse"
```

---

## Task 12: Wire Cover in page.tsx

**Files:**
- Modify: `apps/invitation/src/app/[slug]/page.tsx`
- Modify: `apps/invitation/src/components/SectionRenderer.tsx`

- [ ] **Step 1: Update SectionRenderer to skip `cover` section**

Di `SectionRenderer.tsx`, di dalam `switch (section.componentId)`, tambahkan case sebelum `default`:

```tsx
          case 'cover':
            // Cover is rendered as a full-screen overlay by page.tsx, not here
            content = null;
            break;
```

Ini memastikan jika cover ada di sections array, SectionRenderer tidak merender apa-apa.

- [ ] **Step 2: Update page.tsx** — tambah `isOpen` state, extract cover, pass new props.

Tambah import di bagian atas file:
```tsx
import { AnimatePresence } from 'framer-motion';
import Cover from '@/components/Cover';
```

Tambah state baru setelah state yang sudah ada (`const [loading, setLoading] = useState(true)`):
```tsx
  const [isOpen, setIsOpen] = useState(false);
```

Di dalam blok `hasSections ? (` bagian baru, tambah logic extract cover **sebelum** `return`:

Di dalam blok yang ada:
```tsx
  const hasSections = invitation.sections && invitation.sections.length > 0;
```

Ubah menjadi:
```tsx
  const hasSections = invitation.sections && invitation.sections.length > 0;
  const coverSection = invitation.sections?.find((s) => s.componentId === 'cover');
  const contentSections = invitation.sections?.filter((s) => s.componentId !== 'cover') ?? [];
  const stylePresets = templateConfig?.stylePresets || defaultStylePresets;
  const coverPreset = stylePresets[coverSection?.style ?? 'dark'] ?? { bg: '#6B1020', text: '#F5EDE0' };
```

Di dalam JSX blok `hasSections`, ubah:

```tsx
      {hasSections ? (
        <>
          <Hero ... />
          <SectionRenderer sections={invitation.sections!} ... />
          <Footer ... />
        </>
      ) : (
```

Menjadi:
```tsx
      {hasSections ? (
        <>
          <AnimatePresence>
            {!isOpen && coverSection && (
              <Cover
                key="cover"
                groomName={invitation.groomName}
                brideName={invitation.brideName}
                guestName={guest?.invitationName}
                coverText={coverSection.data?.coverText}
                bg={coverPreset.bg}
                onOpen={() => setIsOpen(true)}
              />
            )}
          </AnimatePresence>

          <Hero
            groomName={invitation.groomName}
            brideName={invitation.brideName}
            eventDate={invitation.eventDate}
            venue={invitation.events?.[0]?.venue}
            guestName={guest?.invitationName}
            heroTitle={heroTitle}
            bodyGreeting={bodyGreeting}
            decorConfig={decorConfig}
          />

          <SectionRenderer
            sections={contentSections}
            stylePresets={stylePresets}
            clientId={invitation._id}
            clientSlug={invitation.slug}
            guestSlug={guest?.slug}
            guestRsvpStatus={guest?.rsvpStatus}
            decorConfig={decorConfig}
          />

          <Footer
            groomName={invitation.groomName}
            brideName={invitation.brideName}
            eventDate={invitation.eventDate}
            footerTitle={footerTitle}
            footerMessage={footerMessage}
            decorConfig={decorConfig}
          />
        </>
      ) : (
```

- [ ] **Step 3: Type-check invitation app**

```bash
cd apps/invitation && npx tsc --noEmit
```

Expected: no errors. Jika ada error terkait `decorConfig` type mismatch, tambahkan `as any` sementara atau sesuaikan import type.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/app/[slug]/page.tsx apps/invitation/src/components/SectionRenderer.tsx
git commit -m "feat: wire Cover overlay and pass venue/bodyGreeting/eventDate to components"
```

---

## Task 13: Create Seed Script Nusantara v2 + Update seed-mvp

**Files:**
- Create: `server/src/scripts/seed-nusantara-v2.ts`
- Modify: `server/src/scripts/seed-mvp.ts`

- [ ] **Step 1: Create seed-nusantara-v2.ts**

```typescript
// server/src/scripts/seed-nusantara-v2.ts
// Run: npx tsx server/src/scripts/seed-nusantara-v2.ts

import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Template } from '../models/Template';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

const nusantaraTemplate = {
  name: 'Nusantara',
  slug: 'nusantara',
  description: 'Tema pernikahan Nusantara dengan palet wine-red, cream, dan gold. Menampilkan kekayaan budaya Indonesia.',
  isActive: true,
  config: {
    primaryColor: '#6B1020',
    secondaryColor: '#F5EDE0',
    accentColor: '#C8A84B',
    fontHeading: 'Cormorant Garamond',
    fontBody: 'Lato',
    heroTitle: 'The Wedding of',
    heroSubtitle: 'Dengan memohon rahmat dan ridha Allah Subhanahu Wa Ta\'ala',
    bodyGreeting:
      'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم\nDengan memohon rahmat dan ridha Allah Subhanahu Wa Ta\'ala,\nkami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami.',
    footerTitle: 'Terima Kasih',
    footerMessage: '',
  },
  defaultSections: [
    { componentId: 'cover', style: 'dark', order: 0 },
    { componentId: 'couple-profile', style: 'light', order: 1 },
    { componentId: 'event-detail', style: 'dark', order: 2 },
    { componentId: 'countdown', style: 'light', order: 3 },
    { componentId: 'gallery', style: 'light', order: 4 },
    { componentId: 'location-map', style: 'image-2', order: 5 },
    { componentId: 'rsvp', style: 'dark', order: 6 },
    { componentId: 'wishes', style: 'light', order: 7 },
    { componentId: 'donation', style: 'light', order: 8 },
  ],
  stylePresets: {
    light: { bg: '#F5EDE0', text: '#3D1A0E' },
    dark: { bg: '#6B1020', text: '#F5EDE0' },
    accent: { bg: '#C8A84B', text: '#3D1A0E' },
    'image-1': { bg: '#EDE0CC', text: '#3D1A0E' },
    'image-2': { bg: '#D9C9AD', text: '#3D1A0E' },
  },
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Delete all existing templates
  const deleted = await Template.deleteMany({});
  console.log(`Deleted ${deleted.deletedCount} existing templates`);

  // Create Nusantara template
  const template = await Template.create(nusantaraTemplate);
  console.log(`Created template: ${template.name} (${template._id})`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Update seed-mvp.ts** — ganti 'elegant-sage' template dengan 'nusantara'.

Di `seed-mvp.ts`, ganti blok `// ===== 2. Seed Template — Elegant Sage =====` seluruhnya menjadi:

```typescript
  // ===== 2. Seed Template — Nusantara =====
  let template = await Template.findOne({ slug: 'nusantara' });
  if (!template) {
    console.log('Nusantara template not found. Run seed-nusantara-v2.ts first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('Using Nusantara template:', template._id);
```

Hapus seluruh blok `const templateData = { ... }` dan `const template = await Template.findOneAndUpdate(...)` yang lama. Semua referensi `template._id` di bawahnya tetap sama.

- [ ] **Step 3: Run seed-nusantara-v2.ts**

```bash
cd server && npx tsx src/scripts/seed-nusantara-v2.ts
```

Expected output:
```
Connected to MongoDB
Deleted N existing templates
Created template: Nusantara (<id>)
Done.
```

- [ ] **Step 4: Run seed-mvp.ts**

```bash
npx tsx src/scripts/seed-mvp.ts
```

Expected: user dan client budi-sari dibuat/updated dengan template Nusantara.

- [ ] **Step 5: Commit**

```bash
git add server/src/scripts/seed-nusantara-v2.ts server/src/scripts/seed-mvp.ts
git commit -m "feat: add Nusantara template seed script, replace old templates"
```

---

## Task 14: Visual Verification

**Files:** tidak ada perubahan kode

- [ ] **Step 1: Start dev servers**

```bash
npm run dev
```

Tunggu sampai semua ready: web (3000), invitation (3001), server (5000).

- [ ] **Step 2: Run seed jika belum**

```bash
cd server && npx tsx src/scripts/seed-mvp.ts
```

- [ ] **Step 3: Buka invitation di browser**

Navigasi ke: `http://localhost:3001/budi-sari`

Verifikasi:
- [ ] Cover/envelope muncul dengan bg wine-red dan monogram "B & S"
- [ ] Klik cover → fade out, Hero muncul
- [ ] Hero: nama pasangan besar italic, bismillah text, warna wine-red
- [ ] Couple section: cream bg, cultural quotes panel tampil (5 kutipan)
- [ ] Events section: wine-red bg, kartu bernomor I/II
- [ ] Gallery: heading "Momen Berharga"
- [ ] LocationMap: heading venue, map embed, tombol "Buka di Google Maps"
- [ ] RSVP: wine-red bg, tombol bahasa Indonesia
- [ ] Gift: heading "Amplop Digital", tombol "Salin Nomor"
- [ ] Wishes: heading "Ucapan & Doa"
- [ ] Footer: wine-red, "Nusantara Wedding", QS. Ar-Rum : 21

- [ ] **Step 4: Buka admin dan verifikasi section editor**

Navigasi ke: `http://localhost:3000` → login → client budi-sari → tab Sections

Verifikasi:
- [ ] Dropdown "Add Section" menampilkan "Cover / Opening" sebagai pilihan
- [ ] Section `couple-profile` menampilkan field "Kutipan Budaya" di form editor

- [ ] **Step 5: Type-check semua**

```bash
npm run lint
```

Expected: no errors.

---

## Catatan

- `Story.tsx` dan `MusicPlayer.tsx` tidak diubah — komponen ini tetap ada tapi tidak di default sections Nusantara.
- `BodyGreeting.tsx` tetap ada untuk legacy rendering (tidak dihapus).
- `DECORATION_REGISTRY` tetap ada tapi tidak digunakan oleh template Nusantara (`decorationStyle` kosong → no-op).
- Font Cormorant Garamond diload otomatis oleh `page.tsx` dari Google Fonts berdasarkan `template.config.fontHeading`.
