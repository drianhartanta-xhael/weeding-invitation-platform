# Dega & Ditta Seed Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply ten content/visual changes to the `/dega-ditta` invitation without regressing other clients that share the same components.

**Architecture:** Shared components (`Events`, `Wishes`, `Footer`, `Couple`, `HeroLight`, `LocationMap`, `Cover`) gain optional props whose defaults reproduce today's behaviour; dega-ditta-specific wording/visuals are expressed as data in the seed scripts and passed through `SectionRenderer`/`page.tsx`. Pure value changes (song, dress-code text, font) live directly in the seed scripts. No new image assets are introduced.

**Tech Stack:** Next.js 14 (App Router) + Tailwind + Framer Motion (invitation app); Express + Mongoose + `tsx` seed scripts (server); MongoDB.

**Testing note:** This repo has no test framework configured (per `CLAUDE.md`), and these changes are seed-data + visual component edits. Per-task verification is **TypeScript type-check** (`npx tsc --noEmit`); end-to-end verification is **re-seeding + visual inspection** in the final task. Type-check commands use `cd` exactly as `CLAUDE.md` documents.

**Spec:** `docs/superpowers/specs/2026-05-23-dega-ditta-seed-refresh-design.md`

---

## File Structure

Components / page (workspace `apps/invitation`):
- `src/components/sections/HeroLight.tsx` — hero; gets two mirrored decoration clusters (#2).
- `src/components/sections/Footer.tsx` — footer; hides region eyebrow on explicit empty string (#3).
- `src/components/sections/Wishes.tsx` — wishes; gains optional `text` prop (#4).
- `src/components/sections/Events.tsx` — schedule; gains optional `eyebrow`/`heading`/`text`/`dateLocale` props (#5).
- `src/components/sections/Couple.tsx` — happy-couple; larger bouquet/rings (#6).
- `src/components/sections/LocationMap.tsx` — venue; header decoupled from background image (#9).
- `src/components/Cover.tsx` — opening screen; gains optional `backgroundImage` prop (#10).
- `src/components/SectionRenderer.tsx` — forwards new `Wishes`/`Events` data props.
- `src/app/[slug]/page.tsx` — forwards `coverBackground` to `Cover`.

Seeds (workspace `server`):
- `src/scripts/seed-floral-plum-template.ts` — `fontHeading` (#1) + `regionLabel: ''` (#3).
- `src/scripts/seed-dega-ditta.ts` — wishes text (#4), event-detail text (#5), song (#7), dress-code text (#8), remove location bg (#9), cover background (#10).

---

## Task 1: Heading font → Imperial Script (#1)

**Files:**
- Modify: `server/src/scripts/seed-floral-plum-template.ts:25`

- [ ] **Step 1: Change the heading font**

In `server/src/scripts/seed-floral-plum-template.ts`, inside the `config` object, replace:

```ts
    fontHeading: 'Pinyon Script',
```

with:

```ts
    fontHeading: 'Imperial Script',
```

- [ ] **Step 2: Type-check**

Run: `cd server && npx tsc --noEmit`
Expected: no type errors (command exits silently).

- [ ] **Step 3: Commit**

```bash
git add server/src/scripts/seed-floral-plum-template.ts
git commit -m "feat(dega-ditta): heading font -> Imperial Script"
```

---

## Task 2: Hero — two mirrored candle/flower clusters (#2)

**Files:**
- Modify: `apps/invitation/src/components/sections/HeroLight.tsx:100-114`

Today a single `baseImage` sits centered behind the couple. Replace it with two copies of the same image anchored to the bottom corners (left one mirrored), layered behind the couple photo. Offsets/scale are starting values — tune by viewing the page.

- [ ] **Step 1: Replace the couple-photo block**

In `apps/invitation/src/components/sections/HeroLight.tsx`, replace this exact block:

```tsx
            <div className="relative w-60 sm:w-72 md:w-full max-w-sm">
              {baseImage && (
                <img
                  src={baseImage}
                  alt=""
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2 bottom-[-20%] w-[135%] max-w-none object-contain pointer-events-none z-0"
                />
              )}
              <img
                src={heroPhoto}
                alt={`${groomName} & ${brideName}`}
                className="relative z-10 w-full object-contain"
              />
            </div>
```

with:

```tsx
            <div className="relative w-60 sm:w-72 md:w-full max-w-sm">
              {baseImage && (
                <>
                  {/* bottom-left cluster, mirrored */}
                  <img
                    src={baseImage}
                    alt=""
                    aria-hidden
                    className="absolute bottom-[-6%] left-0 w-[60%] max-w-none object-contain pointer-events-none z-0"
                    style={{ transform: 'translateX(-32%) scaleX(-1)' }}
                  />
                  {/* bottom-right cluster */}
                  <img
                    src={baseImage}
                    alt=""
                    aria-hidden
                    className="absolute bottom-[-6%] right-0 w-[60%] max-w-none object-contain pointer-events-none z-0"
                    style={{ transform: 'translateX(32%)' }}
                  />
                </>
              )}
              <img
                src={heroPhoto}
                alt={`${groomName} & ${brideName}`}
                className="relative z-10 w-full object-contain"
              />
            </div>
```

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors (command exits silently).

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/HeroLight.tsx
git commit -m "feat(dega-ditta): hero candle/flower as two mirrored bottom clusters"
```

---

## Task 3: Footer — hide "Nusantara Wedding" for plum only (#3)

**Files:**
- Modify: `apps/invitation/src/components/sections/Footer.tsx:25-31` and `:56-58`
- Modify: `server/src/scripts/seed-floral-plum-template.ts` (config object)

Mechanism: treat an explicit empty string as "hide", keep the fallback for `undefined`. Then set `regionLabel: ''` only on the plum template.

- [ ] **Step 1: Add the computed label**

In `apps/invitation/src/components/sections/Footer.tsx`, find the line that opens the component body and the color consts that follow:

```tsx
export default function Footer({ groomName, brideName, eventDate, footerMessage, regionStripe, regionLabel, light, illustration }: FooterProps) {
  const bg = light ? 'var(--wedding-secondary, #f5f3eb)' : 'var(--wedding-primary, #6B1020)';
```

Insert a new const directly after that opening line (before `const bg`):

```tsx
export default function Footer({ groomName, brideName, eventDate, footerMessage, regionStripe, regionLabel, light, illustration }: FooterProps) {
  const eyebrowLabel = regionLabel === undefined ? 'Nusantara Wedding' : regionLabel;
  const bg = light ? 'var(--wedding-secondary, #f5f3eb)' : 'var(--wedding-primary, #6B1020)';
```

- [ ] **Step 2: Render the eyebrow conditionally**

In the same file, replace this exact block:

```tsx
        <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
          {regionLabel || 'Nusantara Wedding'}
        </p>
```

with:

```tsx
        {eyebrowLabel && (
          <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            {eyebrowLabel}
          </p>
        )}
```

- [ ] **Step 3: Set the plum template's region label to empty**

In `server/src/scripts/seed-floral-plum-template.ts`, inside the `config` object, add a `regionLabel` line after `footerMessage` (the last config field):

```ts
    footerMessage: 'We are truly grateful for your heartfelt wishes and prayers for our marriage.',
    regionLabel: '',
```

- [ ] **Step 4: Type-check both workspaces**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

Run: `cd server && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/invitation/src/components/sections/Footer.tsx server/src/scripts/seed-floral-plum-template.ts
git commit -m "feat(dega-ditta): hide region eyebrow on plum template only"
```

---

## Task 4: Wishes section → English (#4)

**Files:**
- Modify: `apps/invitation/src/components/sections/Wishes.tsx`
- Modify: `apps/invitation/src/components/SectionRenderer.tsx:129-131`
- Modify: `server/src/scripts/seed-dega-ditta.ts` (`s-wishes` section)

- [ ] **Step 1: Add the `text` prop and defaults to `Wishes`**

In `apps/invitation/src/components/sections/Wishes.tsx`, replace this exact block:

```tsx
interface WishesProps {
  clientId: string;
  initialWishes: Wish[];
}

export default function Wishes({ clientId, initialWishes }: WishesProps) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
```

with:

```tsx
interface WishesText {
  eyebrow?: string;
  title?: string;
  namePlaceholder?: string;
  messagePlaceholder?: string;
  submit?: string;
  sending?: string;
  dateLocale?: string;
}

interface WishesProps {
  clientId: string;
  initialWishes: Wish[];
  text?: WishesText;
}

export default function Wishes({ clientId, initialWishes, text }: WishesProps) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const t = {
    eyebrow: 'Pesan & Doa',
    title: 'Ucapan & Doa',
    namePlaceholder: 'Nama Anda',
    messagePlaceholder: 'Tulis ucapan dan doa Anda...',
    submit: 'Kirim Ucapan 🌸',
    sending: 'Mengirim...',
    dateLocale: 'id-ID',
    ...text,
  };
```

- [ ] **Step 2: Use `t` in the header**

In the same file, replace this exact block:

```tsx
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Pesan &amp; Doa
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Ucapan &amp; Doa
        </h2>
```

with:

```tsx
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          {t.eyebrow}
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          {t.title}
        </h2>
```

- [ ] **Step 3: Use `t` in the form inputs and button**

In the same file, replace the name input's placeholder:

```tsx
            placeholder="Nama Anda"
```

with:

```tsx
            placeholder={t.namePlaceholder}
```

Replace the textarea's placeholder:

```tsx
            placeholder="Tulis ucapan dan doa Anda..."
```

with:

```tsx
            placeholder={t.messagePlaceholder}
```

Replace the submit button label:

```tsx
            {loading ? 'Mengirim...' : 'Kirim Ucapan 🌸'}
```

with:

```tsx
            {loading ? t.sending : t.submit}
```

- [ ] **Step 4: Use `t.dateLocale` for the wish date**

In the same file, replace:

```tsx
                {new Date(wish.createdAt).toLocaleDateString('id-ID')}
```

with:

```tsx
                {new Date(wish.createdAt).toLocaleDateString(t.dateLocale)}
```

- [ ] **Step 5: Forward `text` from `SectionRenderer`**

In `apps/invitation/src/components/SectionRenderer.tsx`, replace this exact line:

```tsx
            content = <Wishes clientId={clientId} initialWishes={[]} />;
```

with:

```tsx
            content = <Wishes clientId={clientId} initialWishes={[]} text={section.data.text} />;
```

- [ ] **Step 6: Set English wishes text in the seed**

In `server/src/scripts/seed-dega-ditta.ts`, find the `s-wishes` section and replace this exact block:

```ts
      {
        id: 's-wishes',
        componentId: 'wishes',
        data: {},
        style: 'accent',
        order: 8,
      },
```

with:

```ts
      {
        id: 's-wishes',
        componentId: 'wishes',
        data: {
          text: {
            eyebrow: 'Wishes & Prayers',
            title: 'Send Your Wishes',
            namePlaceholder: 'Your name',
            messagePlaceholder: 'Write your wishes and prayers...',
            submit: 'Send Wish 🌸',
            sending: 'Sending...',
            dateLocale: 'en-US',
          },
        },
        style: 'accent',
        order: 8,
      },
```

- [ ] **Step 7: Type-check both workspaces**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

Run: `cd server && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 8: Commit**

```bash
git add apps/invitation/src/components/sections/Wishes.tsx apps/invitation/src/components/SectionRenderer.tsx server/src/scripts/seed-dega-ditta.ts
git commit -m "feat(dega-ditta): English wishes section via text prop"
```

---

## Task 5: Schedule → "Rundown", English, no "Hari Istimewa" (#5)

**Files:**
- Modify: `apps/invitation/src/components/sections/Events.tsx`
- Modify: `apps/invitation/src/components/SectionRenderer.tsx:92-94`
- Modify: `server/src/scripts/seed-dega-ditta.ts` (`s-itinerary` section)

- [ ] **Step 1: Make `formatDate` locale-aware**

In `apps/invitation/src/components/sections/Events.tsx`, replace this exact block:

```tsx
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
```

with:

```tsx
function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
```

- [ ] **Step 2: Add props + defaults to `Events`**

In the same file, replace this exact block:

```tsx
interface EventsProps {
  events: Event[];
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
```

with:

```tsx
interface EventsText {
  dateLabel?: string;
  timeLabel?: string;
  venueLabel?: string;
  mapLabel?: string;
}

interface EventsProps {
  events: Event[];
  eyebrow?: string;
  heading?: string;
  text?: EventsText;
  dateLocale?: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
```

- [ ] **Step 3: Destructure props and compute resolved values**

In the same file, replace this exact block:

```tsx
export default function Events({ events }: EventsProps) {
  if (!events || events.length === 0) return null;

  return (
```

with:

```tsx
export default function Events({ events, eyebrow, heading, text, dateLocale }: EventsProps) {
  if (!events || events.length === 0) return null;

  const eb = eyebrow === undefined ? 'Rangkaian Acara' : eyebrow;
  const hd = heading || 'Hari Istimewa';
  const locale = dateLocale || 'id-ID';
  const t = {
    dateLabel: 'Tanggal',
    timeLabel: 'Waktu',
    venueLabel: 'Tempat',
    mapLabel: 'Lihat Peta',
    ...text,
  };

  return (
```

- [ ] **Step 4: Render the resolved header**

In the same file, replace this exact block:

```tsx
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
          Rangkaian Acara
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic">
          Hari Istimewa
        </h2>
```

with:

```tsx
        {eb && (
          <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            {eb}
          </p>
        )}
        <h2 className="font-heading text-3xl md:text-4xl italic">
          {hd}
        </h2>
```

- [ ] **Step 5: Use the resolved labels and locale in the rows**

In the same file, replace this exact block:

```tsx
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Tanggal</p>
                <p>{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Waktu</p>
                <p>{event.time}</p>
              </div>
              {event.venue && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>Tempat</p>
                  <p>{event.venue}</p>
                  {event.address && <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{event.address}</p>}
                </div>
              )}
            </div>
```

with:

```tsx
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>{t.dateLabel}</p>
                <p>{formatDate(event.date, locale)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>{t.timeLabel}</p>
                <p>{event.time}</p>
              </div>
              {event.venue && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>{t.venueLabel}</p>
                  <p>{event.venue}</p>
                  {event.address && <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{event.address}</p>}
                </div>
              )}
            </div>
```

- [ ] **Step 6: Use the resolved map-button label**

In the same file, replace this exact line:

```tsx
                Lihat Peta
```

with:

```tsx
                {t.mapLabel}
```

- [ ] **Step 7: Forward the props from `SectionRenderer`**

In `apps/invitation/src/components/SectionRenderer.tsx`, replace this exact line:

```tsx
            content = <Events events={section.data.events || []} />;
```

with:

```tsx
            content = (
              <Events
                events={section.data.events || []}
                eyebrow={section.data.eyebrow}
                heading={section.data.heading}
                text={section.data.text}
                dateLocale={section.data.dateLocale}
              />
            );
```

- [ ] **Step 8: Set "Rundown" + English in the seed**

In `server/src/scripts/seed-dega-ditta.ts`, find the `s-itinerary` section and replace this exact block:

```ts
      {
        id: 's-itinerary',
        componentId: 'event-detail',
        data: { events },
        style: 'light',
        order: 4,
      },
```

with:

```ts
      {
        id: 's-itinerary',
        componentId: 'event-detail',
        data: {
          events,
          heading: 'Rundown',
          eyebrow: '',
          dateLocale: 'en-US',
          text: { dateLabel: 'Date', timeLabel: 'Time', venueLabel: 'Venue', mapLabel: 'View Map' },
        },
        style: 'light',
        order: 4,
      },
```

- [ ] **Step 9: Type-check both workspaces**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

Run: `cd server && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 10: Commit**

```bash
git add apps/invitation/src/components/sections/Events.tsx apps/invitation/src/components/SectionRenderer.tsx server/src/scripts/seed-dega-ditta.ts
git commit -m "feat(dega-ditta): Rundown schedule heading + English labels"
```

---

## Task 6: Enlarge bouquet & rings in Happy Couple (#6)

**Files:**
- Modify: `apps/invitation/src/components/sections/Couple.tsx:69-74`

- [ ] **Step 1: Bump the image sizes**

In `apps/invitation/src/components/sections/Couple.tsx`, replace this exact block:

```tsx
              {bouquetImage && (
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-10 sm:-left-14 bottom-2 w-24 sm:w-32 object-contain pointer-events-none" />
              )}
              {ringsImage && (
                <img src={ringsImage} alt="" aria-hidden className="absolute -right-6 sm:-right-8 -bottom-4 w-20 sm:w-24 object-contain pointer-events-none" />
              )}
```

with:

```tsx
              {bouquetImage && (
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-12 sm:-left-16 bottom-1 w-36 sm:w-44 object-contain pointer-events-none" />
              )}
              {ringsImage && (
                <img src={ringsImage} alt="" aria-hidden className="absolute -right-8 sm:-right-10 -bottom-6 w-28 sm:w-32 object-contain pointer-events-none" />
              )}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/Couple.tsx
git commit -m "feat(dega-ditta): enlarge bouquet & rings in happy couple section"
```

---

## Task 7: Song + dress-code text (#7, #8)

**Files:**
- Modify: `server/src/scripts/seed-dega-ditta.ts` (`music.videoId` and Ladies dress group)

- [ ] **Step 1: Change the song video id**

In `server/src/scripts/seed-dega-ditta.ts`, replace this exact line:

```ts
      videoId: 'dt25SFw8H4Y',
```

with:

```ts
      videoId: 'DBoaOnj6Ll4',
```

- [ ] **Step 2: Change the Ladies dress-code description**

In the same file, replace this exact line:

```ts
            { label: 'Ladies', description: 'The shades of flowers, except white flowers', figure: 'ladies', image: `${P}/ladies.png` },
```

with:

```ts
            { label: 'Ladies', description: 'The shades of flowers in pastel colours', figure: 'ladies', image: `${P}/ladies.png` },
```

- [ ] **Step 3: Type-check**

Run: `cd server && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/scripts/seed-dega-ditta.ts
git commit -m "feat(dega-ditta): new song + pastel dress-code wording"
```

---

## Task 8: Location map — header decoupled from background (#9, component)

**Files:**
- Modify: `apps/invitation/src/components/sections/LocationMap.tsx:42-60`

Drive the elegant header off the `heading` prop (or a background image), so removing the background in Task 9 still yields the clean English header rather than the legacy "Lokasi" eyebrow.

- [ ] **Step 1: Replace the header branch condition**

In `apps/invitation/src/components/sections/LocationMap.tsx`, replace this exact block:

```tsx
        {backgroundImage ? (
          <>
            <h2 className="font-heading text-4xl md:text-5xl italic" style={{ color: 'var(--wedding-accent, #ba6193)' }}>
              {heading || 'Venue'}
            </h2>
            {venue && <p className="mt-2 text-sm" style={{ color: 'var(--wedding-primary, #823460)' }}>{venue}</p>}
          </>
        ) : (
          <>
            <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
              Lokasi
            </p>
            <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
              {venue || 'Lokasi Acara'}
            </h2>
          </>
        )}
```

with:

```tsx
        {(heading || backgroundImage) ? (
          <>
            <h2 className="font-heading text-4xl md:text-5xl italic" style={{ color: 'var(--wedding-accent, #ba6193)' }}>
              {heading || 'Venue'}
            </h2>
            {venue && <p className="mt-2 text-sm" style={{ color: 'var(--wedding-primary, #823460)' }}>{venue}</p>}
          </>
        ) : (
          <>
            <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
              Lokasi
            </p>
            <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
              {venue || 'Lokasi Acara'}
            </h2>
          </>
        )}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/LocationMap.tsx
git commit -m "feat(dega-ditta): location header driven by heading prop, not background"
```

---

## Task 9: Move the venue backdrop from map to Cover (#9 seed, #10)

**Files:**
- Modify: `apps/invitation/src/components/Cover.tsx:7-37` and `:42-63`
- Modify: `apps/invitation/src/app/[slug]/page.tsx:248-259`
- Modify: `server/src/scripts/seed-dega-ditta.ts` (`s-location` and `s-cover` sections)

The seed step removes `backgroundImage` from the location section **and** adds `coverBackground` to the cover section in the same commit, so `venueBgImg` is never left unused.

- [ ] **Step 1: Add a `backgroundImage` prop to `Cover`**

In `apps/invitation/src/components/Cover.tsx`, replace this exact block:

```tsx
  coverImage?: string;
  inviteText?: string;
  openText?: string;
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
  coverImage,
  inviteText,
  openText,
  onOpen,
}: CoverProps) {
```

with:

```tsx
  coverImage?: string;
  backgroundImage?: string;
  inviteText?: string;
  openText?: string;
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
  coverImage,
  backgroundImage,
  inviteText,
  openText,
  onOpen,
}: CoverProps) {
```

- [ ] **Step 2: Render the backdrop in the `coverImage` branch**

In the same file, replace this exact block:

```tsx
  if (coverImage) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden px-6"
        style={{ backgroundColor: bg, cursor: 'pointer' }}
        onClick={onOpen}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center relative z-10 max-w-lg w-full"
        >
```

with:

```tsx
  if (coverImage) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden px-6"
        style={{ backgroundColor: bg, cursor: 'pointer' }}
        onClick={onOpen}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.6 }}
      >
        {backgroundImage && (
          <div
            aria-hidden
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${bg}cc, ${bg}cc), url('${backgroundImage}')`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center relative z-10 max-w-lg w-full"
        >
```

Note: `bg` here is the cover background colour (e.g. `#f5f3eb`), a 6-digit hex; appending `cc` makes it ~80% opaque so the title stays legible over the backdrop. Tune the alpha by viewing the page.

- [ ] **Step 3: Forward `coverBackground` from `page.tsx`**

In `apps/invitation/src/app/[slug]/page.tsx`, replace this exact block:

```tsx
                  <Cover
                    key="cover-overlay"
                    groomName={invitation.groomName}
                    brideName={invitation.brideName}
                    guestName={guest?.invitationName}
                    coverText={coverSection.data.coverText}
                    coverImage={coverSection.data.coverImage}
                    inviteText={coverSection.data.inviteText}
                    openText={coverSection.data.openText}
                    bg={templateConfig?.stylePresets?.['dark']?.bg}
                    accent={templateConfig?.config?.accentColor}
                    textColor={templateConfig?.stylePresets?.['dark']?.text}
                    HeroDecor={decorConfig.HeroDecor}
                    decorColors={decorConfig.colors}
                    onOpen={() => setIsOpen(true)}
                  />
```

with:

```tsx
                  <Cover
                    key="cover-overlay"
                    groomName={invitation.groomName}
                    brideName={invitation.brideName}
                    guestName={guest?.invitationName}
                    coverText={coverSection.data.coverText}
                    coverImage={coverSection.data.coverImage}
                    backgroundImage={coverSection.data.coverBackground}
                    inviteText={coverSection.data.inviteText}
                    openText={coverSection.data.openText}
                    bg={templateConfig?.stylePresets?.['dark']?.bg}
                    accent={templateConfig?.config?.accentColor}
                    textColor={templateConfig?.stylePresets?.['dark']?.text}
                    HeroDecor={decorConfig.HeroDecor}
                    decorColors={decorConfig.colors}
                    onOpen={() => setIsOpen(true)}
                  />
```

- [ ] **Step 4: Seed — remove location background, add cover background**

In `server/src/scripts/seed-dega-ditta.ts`, in the `s-location` section, delete this exact line (and only this line):

```ts
          backgroundImage: venueBgImg,
```

Then in the `s-cover` section, replace this exact block:

```ts
        data: {
          coverText: 'Kepada Yth.',
          coverImage: envelopeImg,
          inviteText: 'You are cordially invited to celebrate the day of',
          openText: 'Click to open the invitation.',
        },
```

with:

```ts
        data: {
          coverText: 'Kepada Yth.',
          coverImage: envelopeImg,
          coverBackground: venueBgImg,
          inviteText: 'You are cordially invited to celebrate the day of',
          openText: 'Click to open the invitation.',
        },
```

- [ ] **Step 5: Type-check both workspaces**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

Run: `cd server && npx tsc --noEmit`
Expected: no type errors (in particular, `venueBgImg` is still referenced — by the cover section — so no unused-variable error).

- [ ] **Step 6: Commit**

```bash
git add apps/invitation/src/components/Cover.tsx apps/invitation/src/app/[slug]/page.tsx server/src/scripts/seed-dega-ditta.ts
git commit -m "feat(dega-ditta): move venue backdrop from map to cover screen"
```

---

## Task 10: Re-seed and verify end-to-end

**Files:** none (operational).

- [ ] **Step 1: Ensure MongoDB is running**

Run: `docker-compose up -d`
Expected: the mongo container is up (or already running).

- [ ] **Step 2: Re-seed template then client (order matters)**

Run: `npx tsx server/src/scripts/seed-floral-plum-template.ts`
Expected: logs `Template "Floral Watercolor — Plum" upserted (...)`.

Run: `npx tsx server/src/scripts/seed-dega-ditta.ts`
Expected: logs `Client "Dega & Ditta" upserted (...)` and the invitation URLs.

- [ ] **Step 3: Lint the invitation app**

Run: `npm run lint`
Expected: lint passes (no errors).

- [ ] **Step 4: Start the invitation app and inspect**

Run: `npm run dev:invitation`
Open `http://localhost:3001/dega-ditta` and `http://localhost:3001/dega-ditta?to=wayan-sudana`, then confirm:
- Imperial Script headings throughout (#1).
- Hero: two mirrored candle/flower clusters framing the couple at the bottom corners (#2).
- Cover/opening screen: `venue-bg.png` backdrop visible, "Dega and Ditta" still legible (#10).
- Footer: no "Nusantara Wedding" eyebrow (#3).
- Schedule: "Rundown" heading, no "Hari Istimewa"; rows read Date/Time and dates render in English (#5).
- Wishes: English heading, placeholders, and button (#4).
- Happy Couple: noticeably larger bouquet & rings, nothing clipped (#6).
- Location: clean English "Venue" header, no backdrop, map/button intact (#9).
- Music: the new track plays after opening (#7).
- Dress code Ladies line reads "The shades of flowers in pastel colours" (#8).

- [ ] **Step 5: Regression spot-check (other clients)**

Open a nusantara invitation (e.g. a `seed-regions`/`seed-nusantara` client) and confirm its footer region label and Indonesian schedule/wishes wording are unchanged; confirm a non-region demo (budi-sari) footer still shows "Nusantara Wedding". No commit needed (read-only verification).

---

## Notes for the executor

- The new optional props are all additive with Indonesian defaults, so the legacy render path in `page.tsx` (which calls `<Wishes>`/`<Events>` without the new props) and all other clients keep their current behaviour.
- Visual offset/scale/alpha values in Tasks 2, 6, and 9 are deliberate starting points — adjust them while viewing the page; they don't affect type-checking or other clients.
- If `npx tsc --noEmit` is unavailable or noisy in `apps/invitation`, fall back to `npm run build:invitation` for type verification.
