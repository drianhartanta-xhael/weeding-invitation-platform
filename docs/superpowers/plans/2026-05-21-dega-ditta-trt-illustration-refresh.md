# dega-ditta TRT Illustration Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the dega-ditta Cover, Hero, Mempelai, and Venue sections to match the couple's TRT watercolor references, gated to dega-ditta only.

**Architecture:** Additive, backward-compatible branches in four shared components (Cover, HeroLight, Couple, LocationMap), selected by per-section Mongoose `Mixed` `data` fields and the existing `heroVariant:'light'` template. No model changes (reuse the `heroAccent` `customContent` field for the hero base image). dega-lauditta keeps its current rendering.

**Tech Stack:** Next.js 14 (invitation app :3001), Express + Mongoose (:5000), MongoDB (Docker), `tsx` seeds, TypeScript. No test framework — `npm run lint` (turbo/tsc) + `cd server && npx tsc --noEmit` are the gates.

**Spec:** `docs/superpowers/specs/2026-05-21-dega-ditta-trt-illustration-refresh-design.md`

---

## File Structure

- `apps/invitation/public/assets/dega-ditta/` — 5 new PNGs copied from `dega-dita-asets2/TRT/`.
- `Cover.tsx` — add illustration cover variant (envelope).
- `sections/HeroLight.tsx` — remove rings crest; add candle/floral base behind couple.
- `sections/Couple.tsx` — add `layout:'split'` branch.
- `sections/LocationMap.tsx` — add `backgroundImage` venue variant (keeps iframe).
- `SectionRenderer.tsx` — pass new fields; honor `noDecor`.
- `app/[slug]/page.tsx` — Cover + HeroLight wiring.
- `server/src/scripts/seed-dega-ditta.ts` — asset paths, parent names, section data.

There is NO test framework; each task ends with lint + commit. The dev stack + MongoDB are assumed running (`docker-compose up -d`, `npm run dev`). Append to every commit message:

```
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

---

## Task 1: Copy TRT assets

**Files:** Create 5 files in `apps/invitation/public/assets/dega-ditta/`.

- [ ] **Step 1: Copy and rename**

PowerShell:
```powershell
$src='D:\CV\apps\wedding-invitation-platform\dega-dita-asets2\TRT'
$dst='D:\CV\apps\wedding-invitation-platform\apps\invitation\public\assets\dega-ditta'
Copy-Item "$src\Untitled design (1).png" "$dst\envelope.png" -Force
Copy-Item "$src\IMG_2282.PNG" "$dst\hero-decor.png" -Force
Copy-Item "$src\IMG_2280.PNG" "$dst\bouquet.png" -Force
Copy-Item "$src\IMG_2287.PNG" "$dst\couple-rings.png" -Force
Copy-Item "$src\IMG_2289.PNG" "$dst\venue-bg.png" -Force
Get-ChildItem $dst -Filter *.png | Select-Object Name
```
Expected: `envelope.png`, `hero-decor.png`, `bouquet.png`, `couple-rings.png`, `venue-bg.png` present.

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/public/assets/dega-ditta
git commit -m "assets(dega-ditta): TRT illustrations (envelope, hero-decor, bouquet, rings, venue-bg)"
```

---

## Task 2: Cover illustration variant

**Files:** Modify `apps/invitation/src/components/Cover.tsx`.

- [ ] **Step 1: Add props** — replace the `CoverProps` interface with:

```tsx
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
  coverImage?: string;
  inviteText?: string;
  openText?: string;
  onOpen: () => void;
}
```

- [ ] **Step 2: Destructure new props** — replace the function signature/destructure (lines 20-31) with:

```tsx
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
  const label = coverText || 'Kepada Yth.';
  const g0 = groomName.trim()[0]?.toUpperCase() || 'B';
  const b0 = brideName.trim()[0]?.toUpperCase() || 'S';

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
          <p className="text-sm sm:text-base mb-6" style={{ color: accent }}>
            {inviteText || 'You are cordially invited to celebrate the day of'}
          </p>
          <h1 className="font-heading italic text-5xl sm:text-7xl leading-[0.95] mb-8 break-words" style={{ color: accent }}>
            {groomName} and {brideName}
          </h1>
          <img src={coverImage} alt="" aria-hidden className="w-56 sm:w-72 h-auto object-contain mb-8" />
          <motion.p
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm sm:text-base"
            style={{ color: accent }}
          >
            {openText || 'Click to open the invitation.'}
          </motion.p>
          {guestName && (
            <p className="mt-4 text-xs tracking-widest" style={{ color: textColor }}>
              Kepada Yth. {guestName}
            </p>
          )}
        </motion.div>
      </motion.div>
    );
  }

```

This opens an `if (coverImage)` early-return before the existing default cover. The existing `return ( <motion.div ...>` block (the heart cover) stays exactly as-is directly below — it becomes the `else` path. Verify the file still has one trailing `}` closing the function after the existing return.

- [ ] **Step 3: Type-check** — `npm run lint` → PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/components/Cover.tsx
git commit -m "feat(invitation): Cover illustration variant (envelope) when coverImage set"
```

---

## Task 3: Hero base image (remove rings crest)

**Files:** Modify `apps/invitation/src/components/sections/HeroLight.tsx`.

- [ ] **Step 1: Rename the prop** — in `HeroLightProps`, replace `ringsImage?: string;` with `baseImage?: string;`. In the function destructure replace `ringsImage` with `baseImage`.

- [ ] **Step 2: Remove the rings crest** — delete this block (the `{ringsImage && (...)}` `motion.img` near the top of the returned JSX, before the names `<motion.h1>`):

```tsx
      {ringsImage && (
        <motion.img
          src={ringsImage}
          alt=""
          aria-hidden
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-14 sm:w-16 mb-3 object-contain"
        />
      )}
```

- [ ] **Step 3: Add the base image behind the couple** — replace the center couple block:

```tsx
        {heroPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.9 }}
            className="order-1 md:order-2 flex justify-center"
          >
            <img
              src={heroPhoto}
              alt={`${groomName} & ${brideName}`}
              className="w-60 sm:w-72 md:w-full max-w-sm object-contain"
            />
          </motion.div>
        )}
```

with:

```tsx
        {heroPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.9 }}
            className="order-1 md:order-2 flex justify-center"
          >
            <div className="relative w-60 sm:w-72 md:w-full max-w-sm">
              {baseImage && (
                <img
                  src={baseImage}
                  alt=""
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2 bottom-[-6%] w-[150%] max-w-none object-contain pointer-events-none z-0"
                />
              )}
              <img
                src={heroPhoto}
                alt={`${groomName} & ${brideName}`}
                className="relative z-10 w-full object-contain"
              />
            </div>
          </motion.div>
        )}
```

- [ ] **Step 4: Type-check** — `npm run lint` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/invitation/src/components/sections/HeroLight.tsx
git commit -m "feat(invitation): HeroLight base illustration, drop rings crest"
```

---

## Task 4: Couple split layout

**Files:** Modify `apps/invitation/src/components/sections/Couple.tsx`.

- [ ] **Step 1: Extend props** — replace the `CoupleProps` interface with:

```tsx
interface CoupleProps {
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
  culturalQuotes?: CulturalQuote[];
  layout?: string;
  heading?: string;
  centerPhoto?: string;
  bouquetImage?: string;
  ringsImage?: string;
  groomLabel?: string;
  brideLabel?: string;
}
```

- [ ] **Step 2: Destructure + add split branch** — replace the function signature line:

```tsx
export default function Couple({
  groomName, brideName, groomPhoto, bridePhoto,
  groomParents, brideParents, culturalQuotes,
}: CoupleProps) {
  return (
```

with (note the new destructured fields and the `if (layout === 'split')` branch inserted before the existing `return`):

```tsx
export default function Couple({
  groomName, brideName, groomPhoto, bridePhoto,
  groomParents, brideParents, culturalQuotes,
  layout, heading, centerPhoto, bouquetImage, ringsImage, groomLabel, brideLabel,
}: CoupleProps) {
  if (layout === 'split') {
    const accent = 'var(--wedding-accent, #ba6193)';
    const primary = 'var(--wedding-primary, #823460)';
    const subText = 'color-mix(in srgb, var(--wedding-primary, #823460) 80%, transparent)';
    const block = (name: string, lbl: string, p: { father: string; mother: string }, order: string) => (
      <motion.div {...fade} className={`text-center ${order}`}>
        <h3 className="font-heading text-3xl md:text-4xl italic mb-4" style={{ color: accent }}>{name}</h3>
        <p className="text-sm tracking-wide mb-3" style={{ color: primary }}>{lbl}</p>
        <p className="text-sm leading-relaxed" style={{ color: subText }}>
          {p.father}<br />and<br />{p.mother}
        </p>
      </motion.div>
    );
    return (
      <section className="py-20 px-5 overflow-hidden">
        <motion.div {...fade} className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-5xl italic" style={{ color: accent }}>
            {heading || 'The happy couple and parents'}
          </h2>
        </motion.div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-12 md:gap-6">
          {block(groomName, groomLabel || 'First son of', groomParents, 'md:order-1')}
          <motion.div {...fade} className="order-first md:order-2 flex justify-center">
            <div className="relative w-60 sm:w-72">
              <div
                className="aspect-square rounded-full overflow-hidden border-4"
                style={{ borderColor: 'color-mix(in srgb, var(--wedding-accent, #ba6193) 30%, transparent)' }}
              >
                {centerPhoto && <img src={centerPhoto} alt={`${groomName} & ${brideName}`} className="w-full h-full object-cover" />}
              </div>
              {bouquetImage && (
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-10 sm:-left-14 bottom-2 w-24 sm:w-32 object-contain pointer-events-none" />
              )}
              {ringsImage && (
                <img src={ringsImage} alt="" aria-hidden className="absolute -right-6 sm:-right-8 -bottom-4 w-20 sm:w-24 object-contain pointer-events-none" />
              )}
            </div>
          </motion.div>
          {block(brideName, brideLabel || 'First daughter of', brideParents, 'md:order-3')}
        </div>
      </section>
    );
  }

  return (
```

The existing two-photo `return ( <section ...>` block stays unchanged directly below as the default path.

- [ ] **Step 3: Type-check** — `npm run lint` → PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/components/sections/Couple.tsx
git commit -m "feat(invitation): Couple split layout (center photo + names + bouquet/rings)"
```

---

## Task 5: LocationMap venue background variant

**Files:** Modify `apps/invitation/src/components/sections/LocationMap.tsx`.

- [ ] **Step 1: Extend props** — replace the `LocationMapProps` interface and the destructure line:

```tsx
interface LocationMapProps {
  venue: string;
  address: string;
  mapUrl?: string;
  accentImage?: string;
  backgroundImage?: string;
  heading?: string;
  buttonLabel?: string;
}

export default function LocationMap({ venue, address, mapUrl, accentImage, backgroundImage, heading, buttonLabel }: LocationMapProps) {
```

- [ ] **Step 2: Section bg + header** — replace the opening `<section ...>` and the header `motion.div` (the block that renders the "Lokasi" `<p>` + `{venue}` `<h2>`) with:

```tsx
  const sectionStyle = backgroundImage
    ? { backgroundImage: `url('${backgroundImage}')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center top', backgroundSize: 'contain' as const }
    : undefined;

  return (
    <section className="py-20 px-4 relative" style={sectionStyle}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10 relative z-10"
      >
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
      </motion.div>
```

(Keep the rest of the component — the `accentImage` block, the `<div className="max-w-2xl mx-auto">` map card with the iframe, address, and the `<a>` button — unchanged, EXCEPT wrap that outer content area so it sits above the background: ensure the `<div className="max-w-2xl mx-auto">` gets `relative z-10` added to its className.)

- [ ] **Step 3: Button label** — in the `<a>` maps button, replace the text `Buka di Google Maps` with `{buttonLabel || 'Buka di Google Maps'}`.

- [ ] **Step 4: max-w wrapper z-index** — change `<div className="max-w-2xl mx-auto">` to `<div className="max-w-2xl mx-auto relative z-10">`.

- [ ] **Step 5: Type-check** — `npm run lint` → PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/invitation/src/components/sections/LocationMap.tsx
git commit -m "feat(invitation): LocationMap venue-background variant + button label"
```

---

## Task 6: SectionRenderer wiring + noDecor

**Files:** Modify `apps/invitation/src/components/SectionRenderer.tsx`.

- [ ] **Step 1: couple-profile fields** — replace the `couple-profile` `<Couple .../>` with:

```tsx
            content = (
              <Couple
                groomName={section.data.groomName || ''}
                brideName={section.data.brideName || ''}
                groomPhoto={section.data.groomPhoto || ''}
                bridePhoto={section.data.bridePhoto || ''}
                groomParents={section.data.groomParents || { father: '', mother: '' }}
                brideParents={section.data.brideParents || { father: '', mother: '' }}
                culturalQuotes={section.data.culturalQuotes}
                layout={section.data.layout}
                heading={section.data.heading}
                centerPhoto={section.data.centerPhoto}
                bouquetImage={section.data.bouquetImage}
                ringsImage={section.data.ringsImage}
                groomLabel={section.data.groomLabel}
                brideLabel={section.data.brideLabel}
              />
            );
```

- [ ] **Step 2: location-map fields** — replace the `location-map` `<LocationMap .../>` with:

```tsx
            content = (
              <LocationMap
                venue={section.data.venue || ''}
                address={section.data.address || ''}
                mapUrl={section.data.mapUrl || ''}
                accentImage={section.data.accentImage}
                backgroundImage={section.data.backgroundImage}
                heading={section.data.heading}
                buttonLabel={section.data.buttonLabel}
              />
            );
```

- [ ] **Step 3: noDecor** — change the SectionDecor guard:

```tsx
            {SectionDecor && decorConfig && (
```

to:

```tsx
            {SectionDecor && decorConfig && !section.data?.noDecor && (
```

- [ ] **Step 4: Type-check** — `npm run lint` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/invitation/src/components/SectionRenderer.tsx
git commit -m "feat(invitation): SectionRenderer passes split/venue fields + noDecor"
```

---

## Task 7: Page wiring (Cover + HeroLight)

**Files:** Modify `apps/invitation/src/app/[slug]/page.tsx`.

- [ ] **Step 1: Cover props** — in the slot-mode `<Cover .../>`, after `coverText={coverSection.data.coverText}` add:

```tsx
                    coverImage={coverSection.data.coverImage}
                    inviteText={coverSection.data.inviteText}
                    openText={coverSection.data.openText}
```

- [ ] **Step 2: HeroLight prop** — in `<HeroLight .../>`, replace `ringsImage={cc?.heroAccent}` with `baseImage={cc?.heroAccent}`.

- [ ] **Step 3: Type-check** — `npm run lint` → PASS.

- [ ] **Step 4: Commit**

```bash
git add "apps/invitation/src/app/[slug]/page.tsx"
git commit -m "feat(invitation): wire Cover image + HeroLight base image"
```

---

## Task 8: Update dega-ditta seed data

**Files:** Modify `server/src/scripts/seed-dega-ditta.ts`.

- [ ] **Step 1: Asset path consts** — after the existing `galleryImages` array, the `P` const is `'/assets/dega-ditta'`. Add (near the top, after `heroPhoto`):

```ts
const envelopeImg = `${P}/envelope.png`;
const heroDecorImg = `${P}/hero-decor.png`;
const bouquetImg = `${P}/bouquet.png`;
const coupleRingsImg = `${P}/couple-rings.png`;
const venueBgImg = `${P}/venue-bg.png`;
```

- [ ] **Step 2: customContent.heroAccent** — change `heroAccent: \`${P}/rings.png\`,` to `heroAccent: heroDecorImg,`.

- [ ] **Step 3: cover section data** — change the `s-cover` section `data: { coverText: 'Kepada Yth.' }` to:

```ts
        data: {
          coverText: 'Kepada Yth.',
          coverImage: envelopeImg,
          inviteText: 'You are cordially invited to celebrate the day of',
          openText: 'Click to open the invitation.',
        },
```

- [ ] **Step 4: couple section data** — replace the `s-couple` section `data` object with:

```ts
        data: {
          layout: 'split',
          heading: 'The happy couple and parents',
          centerPhoto: `${P}/2.jpg`,
          bouquetImage: bouquetImg,
          ringsImage: coupleRingsImg,
          groomName: 'Dega Aprillian',
          brideName: 'Lauditta Soraya Librata',
          groomLabel: 'First son of',
          brideLabel: 'First daughter of',
          groomParents: { father: 'Akhmad Taufikh (alm.)', mother: 'Sri Muji Astuti' },
          brideParents: { father: 'Johan Librata (alm.)', mother: 'Nina Krisnawati' },
          accentMotif: 'hearts',
        },
```

- [ ] **Step 5: location section data** — replace the `s-location` section `data` object with:

```ts
        data: {
          venue: 'Hilton Garden Inn Bali Nusa Dua',
          address: 'Jl. Pratama No.57A, Tanjung, Benoa, South Kuta, Badung Regency, Bali 80361',
          mapUrl,
          backgroundImage: venueBgImg,
          heading: 'Venue',
          buttonLabel: 'GOOGLE MAPS',
          noDecor: true,
        },
```

- [ ] **Step 6: Type-check server** — `cd server && npx tsc --noEmit` → PASS.

- [ ] **Step 7: Run the seed** (MongoDB up)

Run: `npx tsx server/src/scripts/seed-dega-ditta.ts`
Expected: `Client "Dega & Ditta" upserted`, `3 guests upserted`.

- [ ] **Step 8: Commit**

```bash
git add server/src/scripts/seed-dega-ditta.ts
git commit -m "feat(seed): dega-ditta TRT section data + updated parent names"
```

---

## Task 9: Verify

**Files:** none.

- [ ] **Step 1: Full lint** — `npm run lint` → 5/5 successful, exit 0.

- [ ] **Step 2: API check**

PowerShell:
```powershell
$ProgressPreference='SilentlyContinue'
$r = Invoke-RestMethod "http://localhost:5000/api/invitations/dega-ditta"
$cp = $r.invitation.sections | Where-Object { $_.componentId -eq 'couple-profile' }
"couple layout: $($cp.data.layout)"
"centerPhoto: $($cp.data.centerPhoto)"
"groom father: $($cp.data.groomParents.father)"
$loc = $r.invitation.sections | Where-Object { $_.componentId -eq 'location-map' }
"venue bg: $($loc.data.backgroundImage)  noDecor: $($loc.data.noDecor)"
"heroAccent: $($r.invitation.customContent.heroAccent)"
$cov = $r.invitation.sections | Where-Object { $_.componentId -eq 'cover' }
"coverImage: $($cov.data.coverImage)"
```
Expected: `layout: split`, `centerPhoto: /assets/dega-ditta/2.jpg`, `groom father: Akhmad Taufikh (alm.)`, venue bg `/assets/dega-ditta/venue-bg.png`, `noDecor: True`, `heroAccent: /assets/dega-ditta/hero-decor.png`, `coverImage: /assets/dega-ditta/envelope.png`.

- [ ] **Step 2b: Asset 200 check**

```powershell
$ProgressPreference='SilentlyContinue'
'envelope.png','hero-decor.png','bouquet.png','couple-rings.png','venue-bg.png' | ForEach-Object {
  $u = "http://localhost:3001/assets/dega-ditta/$_"
  try { $h = Invoke-WebRequest $u -Method Head -TimeoutSec 10 -UseBasicParsing; "{0} {1}" -f $h.StatusCode, $_ } catch { "ERR $_" }
}
```
Expected: all `200`.

- [ ] **Step 3: Browser (mobile + desktop)** — open `http://localhost:3001/dega-ditta?to=wayan-sudana`. Confirm: envelope cover with invite copy + guest name; hero with candle/floral base under the couple (no rings crest); Mempelai split (center 2.jpg, bouquet left, rings bottom-right, names + new parents left/right); Venue with stage illustration background + map iframe + "GOOGLE MAPS" button + no floral bands.

- [ ] **Step 4: Regression** — open `http://localhost:3001/dega-lauditta`. Confirm unchanged: heart cover, two-photo Mempelai, normal Lokasi map with floral bands.

---

## Notes / follow-ups (out of scope)

- Remaining TRT motifs (tea set, vows, food/dinner, cocktails, fireworks, instruments, cake) for Events/Dress-Code/etc.
- Section reordering, if desired later.
