# Invitation Loading Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blank black screen shown while the invitation page fetches data with a branded plum + gold shimmer skeleton that transitions seamlessly into the Cover overlay.

**Architecture:** A new client component `LoadingSkeleton` renders a full-screen plum background (matching dega-ditta's Cover) with shimmering gold placeholder blocks shaped like the cover layout. It replaces the `<div className="min-h-screen bg-black" />` loading branch in `[slug]/page.tsx`. The plum background paints instantly; shimmer blocks fade in after ~150ms so fast loads don't flash a skeleton. Shimmer is a pure CSS keyframe — no animation library.

**Tech Stack:** Next.js 14 (App Router, client component), Tailwind CSS, plain CSS keyframes.

**Testing note:** This repo has no test framework configured and this is a visual component. Verification per task is `npx tsc --noEmit` plus a final manual throttled-network check in the browser.

---

### Task 1: Add shimmer keyframes to global CSS

**Files:**
- Modify: `apps/invitation/src/app/globals.css`

- [ ] **Step 1: Append the shimmer keyframe and utility class**

Add to the end of `apps/invitation/src/app/globals.css`:

```css
/* Loading skeleton shimmer — gold sweep over translucent blocks (LoadingSkeleton.tsx). */
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background-image: linear-gradient(
    90deg,
    rgba(200, 168, 75, 0) 0%,
    rgba(200, 168, 75, 0.35) 50%,
    rgba(200, 168, 75, 0) 100%
  );
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/invitation/src/app/globals.css
git commit -m "feat(invitation): add skeleton-shimmer keyframes"
```

---

### Task 2: Create the LoadingSkeleton component

**Files:**
- Create: `apps/invitation/src/components/LoadingSkeleton.tsx`

- [ ] **Step 1: Write the component**

Create `apps/invitation/src/components/LoadingSkeleton.tsx` with exactly:

```tsx
'use client';

import { useEffect, useState } from 'react';

// dega-ditta cover palette. Hardcoded because the template's colors arrive with
// the API response and are not yet available while the page is loading.
const PLUM = '#6B1020';
const GOLD = '#C8A84B';

/**
 * Branded loading placeholder shown while the invitation page fetches its data.
 * Mirrors dega-ditta's Cover layout (the coverImage variant) so the real Cover
 * overlay fades in seamlessly. The plum background paints instantly; the shimmer
 * blocks fade in after a short delay so a fast load doesn't flash a skeleton.
 */
export default function LoadingSkeleton() {
  const [showBlocks, setShowBlocks] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBlocks(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: PLUM }}
      aria-busy="true"
      aria-label="Loading invitation"
    >
      <div
        className="flex flex-col items-center text-center w-full max-w-lg transition-opacity duration-500"
        style={{ opacity: showBlocks ? 1 : 0 }}
      >
        {/* invite text line */}
        <Block className="h-3 w-40 mb-6 rounded-full" />
        {/* couple names */}
        <Block className="h-9 w-72 sm:w-96 mb-8 rounded-lg" />
        {/* envelope image area */}
        <Block className="h-40 w-56 sm:h-48 sm:w-72 mb-8 rounded-2xl" />
        {/* "click to open" line */}
        <Block className="h-3 w-48 rounded-full" />
      </div>
    </div>
  );
}

function Block({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{ backgroundColor: `${GOLD}22` }}
    />
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/LoadingSkeleton.tsx
git commit -m "feat(invitation): add branded LoadingSkeleton component"
```

---

### Task 3: Wire LoadingSkeleton into the invitation page

**Files:**
- Modify: `apps/invitation/src/app/[slug]/page.tsx` (import block + loading branch ~lines 172–175)

- [ ] **Step 1: Add the import**

In `apps/invitation/src/app/[slug]/page.tsx`, add this import alongside the other component imports (e.g. just after the `import Cover from '@/components/Cover';` line):

```tsx
import LoadingSkeleton from '@/components/LoadingSkeleton';
```

- [ ] **Step 2: Replace the loading branch**

Replace this exact block:

```tsx
  if (loading) {
    // No spinner — render a dark blank page so the Cover overlay slides in seamlessly.
    return <div className="min-h-screen bg-black" />;
  }
```

with:

```tsx
  if (loading) {
    // Branded shimmer placeholder (plum bg) so the Cover overlay slides in seamlessly.
    return <LoadingSkeleton />;
  }
```

- [ ] **Step 3: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/invitation/src/app/[slug]/page.tsx
git commit -m "feat(invitation): show LoadingSkeleton instead of blank during fetch"
```

---

### Task 4: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the invitation app**

Run: `npm run dev:invitation`
(Ensure MongoDB is up via `docker-compose up -d` and the API is running via `npm run dev:server`, or run `npm run dev` for all.)

- [ ] **Step 2: Throttle the network and load dega-ditta**

In Chrome DevTools → Network tab, set throttling to "Slow 4G". Navigate to `http://localhost:3001/dega-ditta`.

Expected:
- Plum (`#6B1020`) background appears immediately — no black flash.
- After ~150ms, gold shimmer blocks fade in (invite line, names, envelope block, open line) and animate.
- When data finishes loading, the dega-ditta Cover overlay fades in over the same plum background — seamless, no color jump.

- [ ] **Step 3: Verify fast-load has no skeleton flash**

Remove throttling, hard-reload `http://localhost:3001/dega-ditta`.
Expected: plum → Cover with little or no visible shimmer (blocks were still fading in when data arrived).

---

## Self-Review

- **Spec coverage:** Component (Task 2) ✓; plum+gold hardcoded palette (Task 2 constants) ✓; cover-shaped blocks (Task 2 layout) ✓; CSS shimmer, no library (Task 1) ✓; anti-flash 150ms fade-in (Task 2 `showBlocks`) ✓; integration replacing black div (Task 3) ✓; seamless plum→Cover preserved (Task 2 background + Task 4 check) ✓; error state untouched (Task 3 touches only the loading branch) ✓; tsc verification (Tasks 2–3) ✓.
- **Placeholder scan:** none — all steps contain complete code/commands.
- **Type consistency:** `LoadingSkeleton` default export imported and used; `Block` prop `className: string`; constants `PLUM`/`GOLD` used consistently; CSS class `skeleton-shimmer` defined in Task 1 and referenced in Task 2.
