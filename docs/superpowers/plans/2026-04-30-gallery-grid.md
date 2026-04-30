# Gallery Grid Layout Option Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-selectable `layout: 'carousel' | 'grid'` to the gallery section, where `'grid'` renders an adaptive mosaic that mirrors the Nusantara design reference; default stays `'carousel'` so existing clients are unaffected.

**Architecture:** Split today's monolithic `Gallery.tsx` into a thin dispatcher plus `GalleryCarousel`, `GalleryGrid`, and a shared `useLightbox` hook. Add the `layout` field to `GalleryData` and the component registry (reuses the same `select` pattern Story already uses), and pass the field through `SectionRenderer`. Lightbox gets keyboard nav (← → ESC) and `<img loading="lazy">` is set on every tile.

**Tech Stack:** React 18 + Next.js 14 (`apps/invitation`), TypeScript 5, Tailwind 3, framer-motion. Server: Express + Mongoose. No automated test framework — verification is type-check + manual UI checks.

**Spec:** `docs/superpowers/specs/2026-04-30-gallery-grid-design.md`

**Note on TDD:** The codebase has no test runner. Each task uses **type-check + targeted manual verification** as the validation step. The smallest verification (type-check) gates every task; the end-to-end UI checks are concentrated in Task 7 once everything is wired.

**File map:**
- `packages/shared/src/types/components.ts` — extend `GalleryData`, add `layout` field to gallery registry entry.
- `server/src/controllers/clientController.ts` — `buildDefaultSections` `case 'gallery'` now sets `layout: 'carousel'`.
- `apps/invitation/src/components/sections/Gallery.tsx` — rewritten as dispatcher.
- `apps/invitation/src/components/sections/GalleryCarousel.tsx` *(new)* — current carousel body, lifted with lightbox extracted.
- `apps/invitation/src/components/sections/GalleryGrid.tsx` *(new)* — adaptive mosaic.
- `apps/invitation/src/components/sections/useLightbox.tsx` *(new)* — shared hook + portal w/ keyboard nav.
- `apps/invitation/src/components/SectionRenderer.tsx` — pass `layout` to `<Gallery />`.

---

## Task 1: Extend `GalleryData` type and registry

**Files:**
- Modify: `packages/shared/src/types/components.ts:43-45` (interface) and `:194-200` (registry entry).

- [ ] **Step 1: Extend the GalleryData interface**

Replace the block at lines 43-45:

```ts
export interface GalleryData {
  images: string[];
}
```

with:

```ts
export interface GalleryData {
  images: string[];
  layout?: 'carousel' | 'grid';
}
```

- [ ] **Step 2: Add layout field to the gallery registry entry**

Replace the gallery entry at lines 194-200:

```ts
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Photo gallery section',
    icon: 'image',
    fields: [{ key: 'images', label: 'Image URLs', type: 'image-list' }],
  },
```

with:

```ts
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Photo gallery section',
    icon: 'image',
    fields: [
      { key: 'images', label: 'Image URLs', type: 'image-list' },
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'carousel', label: 'Carousel' },
          { value: 'grid', label: 'Grid (mosaic adaptif)' },
        ],
      },
    ],
  },
```

- [ ] **Step 3: Type-check shared package**

Run: `npx tsc --noEmit -p packages/shared`
Expected: PASS (no output / exit 0).

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/components.ts
git commit -m "$(cat <<'EOF'
feat(shared): add layout field to GalleryData and registry

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Default `layout: 'carousel'` for new gallery sections

**Files:**
- Modify: `server/src/controllers/clientController.ts:168-170`.

- [ ] **Step 1: Update the default sections helper**

Replace lines 168-170:

```ts
      case 'gallery':
        data = { images: [] };
        break;
```

with:

```ts
      case 'gallery':
        data = { images: [], layout: 'carousel' };
        break;
```

- [ ] **Step 2: Type-check server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/clientController.ts
git commit -m "$(cat <<'EOF'
feat(server): default gallery sections to layout=carousel

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `useLightbox` hook with keyboard nav

**Files:**
- Create: `apps/invitation/src/components/sections/useLightbox.tsx`.

- [ ] **Step 1: Create the file with this exact content**

```tsx
'use client';

import { useState, useEffect, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UseLightboxResult {
  open: (idx: number) => void;
  lightbox: ReactElement;
}

export function useLightbox(images: string[]): UseLightboxResult {
  const [idx, setIdx] = useState<number | null>(null);

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIdx(null);
      else if (e.key === 'ArrowRight') {
        setIdx((i) => (i === null ? null : (i + 1) % images.length));
      } else if (e.key === 'ArrowLeft') {
        setIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, images.length]);

  const lightbox: ReactElement = (
    <AnimatePresence>
      {idx !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIdx(null)}
        >
          <motion.img
            key={idx}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            src={images[idx]}
            alt="Gallery"
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { open: setIdx, lightbox };
}
```

- [ ] **Step 2: Type-check invitation app**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/useLightbox.tsx
git commit -m "$(cat <<'EOF'
feat(invitation): add useLightbox hook with keyboard navigation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Extract `GalleryCarousel` from current Gallery

**Files:**
- Create: `apps/invitation/src/components/sections/GalleryCarousel.tsx` (lift current `Gallery.tsx` body with lightbox replaced by hook).

- [ ] **Step 1: Create the file with this exact content**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLightbox } from './useLightbox';

interface GalleryCarouselProps {
  images: string[];
}

export default function GalleryCarousel({ images }: GalleryCarouselProps) {
  const { open, lightbox } = useLightbox(images);
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3);
      else if (window.innerWidth >= 768) setVisibleCount(2);
      else setVisibleCount(1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const maxIndex = Math.max(0, images.length - visibleCount);

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(maxIndex, c + 1)), [maxIndex]);

  return (
    <section className="py-20 px-4">
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

      <div className="max-w-5xl mx-auto relative">
        <div className="overflow-hidden rounded-xl">
          <motion.div
            className="flex"
            animate={{ x: `-${current * (100 / visibleCount)}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -50) next();
              else if (info.offset.x > 50) prev();
            }}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => open(index)}
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>

        {images.length > visibleCount && (
          <>
            <button
              onClick={prev}
              disabled={current === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-30 transition-all z-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              onClick={next}
              disabled={current >= maxIndex}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-30 transition-all z-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </>
        )}

        {images.length > visibleCount && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current
                    ? 'bg-wedding-primary scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox}
    </section>
  );
}
```

- [ ] **Step 2: Type-check invitation app**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: PASS (note: an unused-import warning may surface in `Gallery.tsx` until Task 6 — that's still a PASS since it's a warning not an error; if it errors, fix in Task 6).

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/GalleryCarousel.tsx
git commit -m "$(cat <<'EOF'
feat(invitation): extract GalleryCarousel using shared lightbox hook

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create `GalleryGrid` with adaptive mosaic

**Files:**
- Create: `apps/invitation/src/components/sections/GalleryGrid.tsx`.

- [ ] **Step 1: Create the file with this exact content**

```tsx
'use client';

import { motion } from 'framer-motion';
import { useLightbox } from './useLightbox';

interface GalleryGridProps {
  images: string[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const { open, lightbox } = useLightbox(images);
  const count = images.length;

  const gridClass =
    count === 1
      ? 'grid grid-cols-1'
      : count === 2
      ? 'grid grid-cols-2'
      : 'grid grid-cols-2 md:grid-cols-3'; // 3 and 4+

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p
          className="text-xs tracking-[0.25em] uppercase mb-2"
          style={{ color: 'var(--wedding-primary, #6B1020)' }}
        >
          Galeri
        </p>
        <h2
          className="font-heading text-3xl md:text-4xl italic"
          style={{ color: 'var(--wedding-primary, #6B1020)' }}
        >
          Momen Berharga
        </h2>
      </motion.div>

      <div className={`max-w-5xl mx-auto ${gridClass} gap-2.5`}>
        {images.map((image, i) => {
          const isHero = count >= 4 && i === 1;
          const aspectClass =
            count === 1 ? 'aspect-[16/9]' : isHero ? '' : 'aspect-[4/5]';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onClick={() => open(i)}
              className={`${aspectClass} rounded-lg overflow-hidden cursor-pointer hover:scale-[1.04] transition-transform`}
              style={isHero ? { gridRow: 'span 2' } : undefined}
            >
              <img
                src={image}
                alt={`Gallery ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
          );
        })}
      </div>

      {lightbox}
    </section>
  );
}
```

- [ ] **Step 2: Type-check invitation app**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/GalleryGrid.tsx
git commit -m "$(cat <<'EOF'
feat(invitation): add GalleryGrid with adaptive mosaic layout

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Rewrite `Gallery.tsx` as a dispatcher

**Files:**
- Modify (full rewrite): `apps/invitation/src/components/sections/Gallery.tsx`.

- [ ] **Step 1: Replace the entire file with this exact content**

```tsx
'use client';

import GalleryCarousel from './GalleryCarousel';
import GalleryGrid from './GalleryGrid';

interface GalleryProps {
  images: string[];
  layout?: 'carousel' | 'grid';
}

export default function Gallery({ images, layout }: GalleryProps) {
  if (!images || images.length === 0) return null;
  return layout === 'grid' ? (
    <GalleryGrid images={images} />
  ) : (
    <GalleryCarousel images={images} />
  );
}
```

- [ ] **Step 2: Type-check invitation app**

Run: `cd apps/invitation && npx tsc --noEmit`

Expected: a single error in `apps/invitation/src/components/SectionRenderer.tsx` complaining that the `<Gallery>` component does not accept a `layout` prop, OR that `images` is the only allowed prop. This is **expected** — Task 7 fixes it. No other errors should appear.

If you see other errors (e.g. inside `Gallery.tsx`, `GalleryCarousel.tsx`, or `GalleryGrid.tsx`), STOP and report `STATUS: BLOCKED` with the error text.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/Gallery.tsx
git commit -m "$(cat <<'EOF'
feat(invitation): rewrite Gallery as carousel/grid dispatcher

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Pass `layout` through `SectionRenderer` + final smoke test

**Files:**
- Modify: `apps/invitation/src/components/SectionRenderer.tsx:87-89`.

- [ ] **Step 1: Pass the layout prop to Gallery**

Replace lines 87-89:

```tsx
          case 'gallery':
            content = <Gallery images={section.data.images || []} />;
            break;
```

with:

```tsx
          case 'gallery':
            content = (
              <Gallery
                images={section.data.images || []}
                layout={section.data.layout}
              />
            );
            break;
```

- [ ] **Step 2: Type-check invitation app**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: PASS (zero errors now).

- [ ] **Step 3: Build invitation app**

Run: `cd apps/invitation && npx next build`
Expected: Successful build, `[slug]` page included, no type errors.

If the ESLint warning "ESLint must be installed in order to run during builds" appears, that is preexisting and acceptable per `CLAUDE.md`. Any other failure should block.

- [ ] **Step 4: Manual smoke test**

Bring up the dev environment:
- Make sure MongoDB is running (`docker ps | grep wedding-mongodb`; if not, `docker-compose up -d`).
- Start dev: `npm run dev` (web on 3000, invitation on 3001, server on 5000).
- If invitation app's `apps/invitation/.env.local` points at a stale ngrok URL, temporarily set `NEXT_PUBLIC_API_URL=http://localhost:5000/api` for the duration of testing (back up `.env.local` first; restore at the end).

Then verify each scenario below by visiting `http://localhost:3001/<slug>`. Use any seeded client; if the gallery section has fewer images than needed for a scenario, edit `data.images` directly via the admin UI or temporarily insert URLs.

**Carousel mode (default / existing behavior):**
- Existing client whose gallery section has no `layout` field → renders carousel exactly as before. Drag, arrows, dots, and lightbox tap all work. Click image → lightbox opens; press ← → cycles images; press ESC closes.

**Grid mode:**
1. Set the gallery's `layout` to `'grid'` (via Sections tab → Gallery → Layout dropdown → "Grid (mosaic adaptif)" → Save).
2. Reload the invitation page. Verify each image-count scenario by editing `data.images` length:
   - **0 images:** section is absent.
   - **1 image:** single tile at full width with `aspect-[16/9]`.
   - **2 images:** 2-column grid, both `aspect-[4/5]`.
   - **3 images:** 3 cols on desktop / 2 cols on mobile (resize browser ≤560px), all `aspect-[4/5]`.
   - **4 images:** mosaic — item index 1 spans 2 rows. Last cell may be empty (acceptable).
   - **6 images:** matches reference design layout.
   - **8+ images:** mosaic continues filling rows; index-1 still spans 2 rows.
3. Hover any tile → scales to ~1.04. Click → lightbox opens at correct index. Press ← → cycles. Press ESC closes.
4. Inspect any `<img>` in DevTools → confirm `loading="lazy"` attribute is set.

If any scenario fails, capture the failing scenario and report `STATUS: DONE_WITH_CONCERNS`. Otherwise proceed to commit.

- [ ] **Step 5: Restore env (if you backed it up) and commit**

If you edited `apps/invitation/.env.local`, restore it from the backup. Do NOT commit any env changes.

```bash
git add apps/invitation/src/components/SectionRenderer.tsx
git commit -m "$(cat <<'EOF'
feat(invitation): pass gallery layout through SectionRenderer

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Lint + final build pass

**Files:** all touched.

- [ ] **Step 1: Run repo-wide lint**

Run: `npm run lint`
Expected: 5/5 turbo tasks successful. Preexisting "ESLint must be installed" warnings on `web` and `invitation` are acceptable per CLAUDE.md.

- [ ] **Step 2: Run repo-wide build**

Run: `npm run build`
Expected: 4/4 turbo tasks successful. Both Next apps produce production bundles.

- [ ] **Step 3: Final commit (only if lint required incidental fixes)**

If everything is clean, skip this step — no commit. If you had to fix anything to make lint/build pass:

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: lint fixes for gallery grid feature

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Self-review summary

**Spec coverage:**
- `GalleryData` type + registry select field → Task 1.
- Default `layout: 'carousel'` for new clients → Task 2.
- `useLightbox` hook with index state + ← → ESC keyboard nav + click-image-doesn't-close → Task 3.
- `GalleryCarousel` lifted from current Gallery using shared hook + `loading="lazy"` → Task 4.
- `GalleryGrid` adaptive mosaic (1/2/3/4+) with index-1 hero, `loading="lazy"`, `hover:scale-[1.04]`, mobile 2-col fallback → Task 5.
- Gallery dispatcher returns null for empty → Task 6.
- `SectionRenderer` passes `layout` prop → Task 7.
- Manual UI verification of all image counts, carousel preservation, lightbox keyboard → Task 7 step 4.
- Lint + build green → Task 8.

**Type consistency:**
- `images: string[]` and `layout?: 'carousel' | 'grid'` are the only props throughout: shared type, registry option values, dispatcher props, `SectionRenderer` passthrough, and child components.
- `useLightbox(images: string[])` returns `{ open: (idx: number) => void, lightbox: ReactElement }` consistently used by both child components.
- `GalleryCarouselProps` and `GalleryGridProps` both declare just `images: string[]` (the layout choice is decided by the dispatcher; children don't re-check it).
