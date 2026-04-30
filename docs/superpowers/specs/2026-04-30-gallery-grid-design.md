# Gallery Grid Layout Option — Design Spec

**Date:** 2026-04-30
**Status:** Approved for implementation planning
**Owner:** drianhartanta@gmail.com
**Reference design:** `Nusantara Wedding Full.html` (Anthropic Design handoff bundle, retrieved 2026-04-30) — section "GALERI" lines 175-181 (CSS) and 807-836 (JSX).

## Goal

Admin can choose, per gallery section, whether to render as the existing carousel or as an **adaptive mosaic grid** modeled on the reference design. Default behavior for existing clients stays carousel — zero migration.

## Why this approach

- **Reuses existing patterns.** The component registry already supports a `select` field type (used by Story's `layout: 'vertical' | 'horizontal'`). Adding `layout: 'carousel' | 'grid'` reuses that — no new admin UI primitives.
- **Optional field, default carousel.** Existing client documents without `layout` continue to render carousel via fallback. Migration unnecessary.
- **Component split serves both clarity and the feature.** Splitting `Gallery.tsx` into a dispatcher plus `GalleryCarousel` + `GalleryGrid` + `useLightbox` keeps each file focused on one concern, and lets us add the grid path without bloating an already-150-line file.
- **Adaptive grid handles all image counts gracefully** (1 → full-width, 2 → 2 cols, 3 → 3/2 cols, 4+ → mosaic with hero in column 2). No edge case where the layout looks broken.

## Non-goals (YAGNI)

- Per-image `featured` flag for hero pick. Index 1 mosaic position is sufficient; admin can re-order images if needed.
- Per-image captions.
- Drag-reorder of images inside the editor.
- Infinite scroll / pagination.
- Lazy loading via `IntersectionObserver` (we use the cheap native `loading="lazy"` attribute instead).

## Architecture overview

```
Component Registry (packages/shared)
  GalleryData {
    images: string[];
    layout?: 'carousel' | 'grid';
  }

Invitation App (apps/invitation/src/components/sections/)
  Gallery.tsx           — dispatcher (~25 lines)
  GalleryCarousel.tsx   — current Gallery body, lifted as-is
  GalleryGrid.tsx       — new adaptive mosaic
  useLightbox.tsx       — shared hook + portal w/ keyboard nav

Admin (auto-generated from registry)
  Sections tab → click Gallery → "Layout" dropdown appears
                  (carousel | grid)
```

## Data model

### Shared type (`packages/shared/src/types/components.ts`)

```ts
export interface GalleryData {
  images: string[];
  layout?: 'carousel' | 'grid';
}
```

Optional. Renderer dispatches with `data.layout ?? 'carousel'`.

### Component registry — gallery entry

Replace the current single-field gallery entry:

```ts
fields: [{ key: 'images', label: 'Image URLs', type: 'image-list' }]
```

with:

```ts
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
]
```

This reuses the same `select` field type already used by Story → no new SectionEditor code.

### Default sections helper (`server/src/controllers/clientController.ts`)

The existing `case 'gallery'` returns `{ images: [] }`. Change to:

```ts
case 'gallery':
  data = { images: [], layout: 'carousel' };
  break;
```

So newly-created clients get an explicit default. Existing client documents that lack `layout` still render carousel via the renderer's `?? 'carousel'` fallback.

## Adaptive grid rules

Implemented in `GalleryGrid.tsx` based on `images.length`.

| Count | Layout |
|---|---|
| 0 | dispatcher returns `null` (current behavior) |
| 1 | full-width single tile, `aspect-[16/9]` |
| 2 | 2 cols uniform, `aspect-[4/5]` |
| 3 | 3 cols desktop / 2 cols mobile (≤560px), `aspect-[4/5]` |
| 4+ | **mosaic**: 3 cols desktop / 2 cols mobile, `aspect-[4/5]`, item index 1 spans 2 rows with `aspect-ratio: auto` |

**Mosaic CSS (matches reference):**
- `display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;`
- Mobile (≤560px): `grid-template-columns: repeat(2, 1fr);`
- All items: `aspect-ratio: 4/5; cursor: pointer;` hover `transform: scale(1.04);`
- Item index 1: `grid-row: span 2; aspect-ratio: auto;`

Tailwind utilities:
- `grid grid-cols-2 md:grid-cols-3 gap-2.5` for the container at count ≥ 3.
- `aspect-[4/5] rounded-lg overflow-hidden cursor-pointer hover:scale-[1.04] transition-transform` per tile.
- Inline `style={{ gridRow: 'span 2' }}` on the index-1 tile when count ≥ 4 (no aspect class on that tile so it spans).

**Edge case:** at count = 4 on mobile (2 cols), index-1 spans 2 rows in column 2; items 1, 3, 4 fill column 1 across 3 rows; last row's column 2 is empty. Documented as acceptable editorial whitespace. If users request fill, future PR can add `grid-auto-flow: dense`.

## Component implementations

### `Gallery.tsx` (dispatcher, full rewrite)

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
  return layout === 'grid'
    ? <GalleryGrid images={images} />
    : <GalleryCarousel images={images} />;
}
```

### `GalleryCarousel.tsx` (lifted from current `Gallery.tsx`)

Move the current 150-line carousel implementation verbatim with these changes:
- Drop the inline lightbox JSX and local `selectedImage` state.
- Use `useLightbox(images)` hook; replace per-tile `onClick={() => setSelectedImage(image)}` with `onClick={() => open(i)}`.
- Render `{lightbox}` at the end of the JSX (replacing the removed `AnimatePresence` block).
- Add `loading="lazy"` to the `<img>`.

### `GalleryGrid.tsx` (new)

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
    count === 1 ? 'grid grid-cols-1' :
    count === 2 ? 'grid grid-cols-2' :
                  'grid grid-cols-2 md:grid-cols-3'; // 3 and 4+

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2"
           style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Galeri
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic"
            style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Momen Berharga
        </h2>
      </motion.div>

      <div className={`max-w-5xl mx-auto ${gridClass} gap-2.5`}>
        {images.map((image, i) => {
          const isHero = count >= 4 && i === 1;
          const aspectClass =
            count === 1 ? 'aspect-[16/9]' :
            isHero      ? '' :
                          'aspect-[4/5]';
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

### `useLightbox.tsx` (new — shared hook + portal)

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
        setIdx(i => (i === null ? null : (i + 1) % images.length));
      } else if (e.key === 'ArrowLeft') {
        setIdx(i => (i === null ? null : (i - 1 + images.length) % images.length));
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

The `key={idx}` on the `motion.img` lets framer-motion animate transitions between images when the user uses arrow keys. `e.stopPropagation()` prevents click-on-image from closing the overlay (only click on the dim backdrop closes).

## Renderer integration (`apps/invitation/src/components/SectionRenderer.tsx`)

The current Gallery rendering passes `images` from `data`. Need to also pass `layout`. Verify the exact line during implementation; the change is:

```tsx
case 'gallery':
  return <Gallery images={data.images} layout={data.layout} />;
```

## Testing strategy

No automated test framework (per CLAUDE.md). Manual checklist:

**Type & build:**
- `cd packages/shared && npx tsc --noEmit` — passes.
- `cd apps/invitation && npx tsc --noEmit` — passes.
- `npm run build` — invitation bundle builds.

**Admin (web):**
- Open Sections tab on any client → click Gallery section → "Layout" dropdown shows "Carousel" / "Grid (mosaic adaptif)".
- Toggle to grid, save → reload → choice persists.
- Add a fresh gallery section → defaults to carousel.

**Invitation page (carousel mode):**
- Existing client without `layout` field → renders carousel. No regression.
- Drag, arrow nav, dots, lightbox tap — all work.
- Click image → lightbox opens. Press ← → cycles images. Press ESC closes.

**Invitation page (grid mode):**
- 0 images → null. 1 → full-width 16:9. 2 → 2-col 4:5. 3 → 3-col desktop / 2-col mobile. 4 → mosaic with index-1 spanning 2 rows. 6 → matches reference. 8+ → continued mosaic.
- Mobile (≤560px) → 2-col layout for count ≥ 3.
- Click image → lightbox opens at correct index. ← → cycles. ESC closes.
- Hover scales 1.04. `loading="lazy"` set on all `<img>` (verify via DevTools).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `grid-row: span 2` on mobile w/ count = 4 leaves last cell empty | Medium | Documented & accepted. Future PR can add `grid-auto-flow: dense` if requested. |
| `SectionRenderer` doesn't currently pass `data.layout` | Low | Verify and fix during impl. |
| Tailwind JIT misses `aspect-[16/9]` or `hover:scale-[1.04]` | Very low | Already in use elsewhere; project Tailwind 3 supports arbitrary values. |
| Existing `images: []` clients regress | None | Dispatcher returns null for empty — same as before. |
| Keyboard listener leaks if component unmounts mid-lightbox | Low | `useEffect` cleanup removes listener. |
| Click on lightbox image closes overlay (event bubbling) | Low | `e.stopPropagation()` on the img click handler. |

## File-touch summary

**New files:**
- `apps/invitation/src/components/sections/GalleryCarousel.tsx`
- `apps/invitation/src/components/sections/GalleryGrid.tsx`
- `apps/invitation/src/components/sections/useLightbox.tsx`

**Modified files:**
- `packages/shared/src/types/components.ts` — extend `GalleryData`, update gallery registry entry.
- `apps/invitation/src/components/sections/Gallery.tsx` — full rewrite as dispatcher.
- `apps/invitation/src/components/SectionRenderer.tsx` — pass `layout` prop to Gallery.
- `server/src/controllers/clientController.ts` — `buildDefaultSections` gallery case includes `layout: 'carousel'`.
