# Dega & Ditta Hero/Bouquet/Rundown/Font Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the hero candle/flower clusters in front of the couple without covering the date/venue text, tilt the bouquet left off the faces, recolor the Rundown heading to the plum accent, and switch the heading font to Petit Formal Script.

**Architecture:** Three component edits (`HeroLight`, `Couple`, `Events`) plus one template-seed value change (`fontHeading`). Only the font change needs a re-seed; the rest are component-only. Visual values for the hero clusters and bouquet tilt are starting points tuned live with Playwright.

**Tech Stack:** Next.js 14 (App Router) + Tailwind + Framer Motion; `tsx` seed scripts; Playwright MCP for visual verification.

**Testing note:** No test framework in this repo (per `CLAUDE.md`); these are visual + seed changes. Per-task verification is `npx tsc --noEmit`; final verification is re-seed + Playwright screenshots with live tuning.

**Spec:** `docs/superpowers/specs/2026-05-23-dega-ditta-hero-bouquet-rundown-font-design.md`

---

## File Structure

- `apps/invitation/src/components/sections/HeroLight.tsx` — clusters in front + pulled in (Change 1).
- `apps/invitation/src/components/sections/Couple.tsx` — bouquet tilt (Change 2).
- `apps/invitation/src/components/sections/Events.tsx` — Rundown heading color (Change 3).
- `server/src/scripts/seed-floral-plum-template.ts` — heading font (Change 4).

---

## Task 1: Hero — clusters in front of couple, off the side text

**Files:**
- Modify: `apps/invitation/src/components/sections/HeroLight.tsx`

- [ ] **Step 1: Raise the clusters above the couple and pull them inward**

Replace this exact block:

```tsx
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
```

with:

```tsx
              {baseImage && (
                <>
                  {/* bottom-left cluster, mirrored, in front of the couple */}
                  <img
                    src={baseImage}
                    alt=""
                    aria-hidden
                    className="absolute bottom-[-2%] left-0 w-[52%] max-w-none object-contain pointer-events-none z-20"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {/* bottom-right cluster, in front of the couple */}
                  <img
                    src={baseImage}
                    alt=""
                    aria-hidden
                    className="absolute bottom-[-2%] right-0 w-[52%] max-w-none object-contain pointer-events-none z-20"
                  />
                </>
              )}
              <img
                src={heroPhoto}
                alt={`${groomName} & ${brideName}`}
                className="relative z-10 w-full object-contain"
              />
```

(`z-20` puts the clusters in front of the couple `z-10`; removing the outward `translateX(±32%)` and trimming `w-[60%]`→`w-[52%]` keeps them within the photo footprint so they no longer overlap the date/venue columns. `bottom-[-2%]` raises them slightly. These are starting values — tuned in Task 5.)

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors (command exits silently).

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/HeroLight.tsx
git commit -m "feat(dega-ditta): hero clusters in front of couple, off the side text"
```

---

## Task 2: Couple — tilt bouquet left, off the faces

**Files:**
- Modify: `apps/invitation/src/components/sections/Couple.tsx`

- [ ] **Step 1: Add a left tilt to the bouquet**

Replace this exact line:

```tsx
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-14 sm:-left-20 -bottom-14 w-32 sm:w-40 object-contain pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
```

with:

```tsx
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-14 sm:-left-20 -bottom-14 w-32 sm:w-40 object-contain pointer-events-none" style={{ transform: 'scaleX(-1) rotate(12deg)', transformOrigin: 'bottom center' }} />
```

(With the `scaleX(-1)` flip, `rotate(12deg)` tilts the visible top to the left so the flowers lean outward, off the faces; `transformOrigin: bottom center` keeps the stem anchored. Angle/sign tuned live in Task 5.)

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/Couple.tsx
git commit -m "feat(dega-ditta): tilt bouquet left off the faces"
```

---

## Task 3: Rundown — heading color matches other headings

**Files:**
- Modify: `apps/invitation/src/components/sections/Events.tsx`

- [ ] **Step 1: Give the Rundown heading the plum accent color**

Replace this exact block:

```tsx
        <h2 className="font-heading text-3xl md:text-4xl italic">
          {hd}
        </h2>
```

with:

```tsx
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-accent, #ba6193)' }}>
          {hd}
        </h2>
```

- [ ] **Step 2: Type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/Events.tsx
git commit -m "feat(dega-ditta): Rundown heading uses plum accent color"
```

---

## Task 4: Heading font → Petit Formal Script

**Files:**
- Modify: `server/src/scripts/seed-floral-plum-template.ts`

- [ ] **Step 1: Change the heading font**

Replace this exact line:

```ts
    fontHeading: 'Imperial Script',
```

with:

```ts
    fontHeading: 'Petit Formal Script',
```

- [ ] **Step 2: Type-check**

Run: `cd server && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/scripts/seed-floral-plum-template.ts
git commit -m "feat(dega-ditta): heading font -> Petit Formal Script"
```

---

## Task 5: Re-seed font + visual verification/tuning

**Files:** none (operational; minor follow-up tweaks to Tasks 1–2 values as needed).

- [ ] **Step 1: Re-seed the plum template (applies the font)**

Run: `npx tsx server/src/scripts/seed-floral-plum-template.ts`
Expected: logs `Template "Floral Watercolor — Plum" upserted (...)`. (Needs MongoDB running.)

- [ ] **Step 2: Confirm dev servers are up**

Run: `curl -s -o /dev/null -w "inv:%{http_code} " http://localhost:3001/dega-ditta; curl -s -o /dev/null -w "api:%{http_code}\n" http://localhost:5000/api/invitations/dega-ditta`
Expected: `inv:200 api:200`. If down: `docker-compose up -d` then `npm run dev`.

- [ ] **Step 3: Screenshot + verify with Playwright**

At `http://localhost:3001/dega-ditta?to=wayan-sudana`, capture the hero at a desktop width (~1024) and mobile (~430), plus the Happy Couple and Rundown sections. Confirm:
- Hero: clusters render in front of the couple; date ("26 JULY 2026") and venue ("HILTON GARDEN INN BALI, NUSA DUA") text fully visible, not overlapped.
- Couple: bouquet tilts left, clear of the faces.
- Rundown: heading is plum accent, matching "Venue"/"Dress Code".
- All headings render in Petit Formal Script.

- [ ] **Step 4: Tune values if needed, then commit**

If a value needs adjustment, edit the relevant file from Tasks 1–2 (hero cluster
`z`/`w-[..]`/`bottom-[..]`/inset in `HeroLight.tsx`; bouquet `rotate(..)` angle in
`Couple.tsx`), re-screenshot, then:

```bash
git add -A
git commit -m "fix(dega-ditta): tune hero clusters + bouquet tilt"
```

(If no tuning is needed, skip this commit.)

- [ ] **Step 5: Final type-check**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: no type errors.

---

## Notes for the executor

- Hero cluster `z-20` deliberately matches the title's stacking level; they don't overlap (title is at the top, clusters at the photo bottom).
- Only the dega-ditta plum template uses this `fontHeading`, so the font change is scoped to dega-ditta. The hero/couple/rundown edits are gated on dega-ditta's data (heroAccent, bouquetImage, event-detail heading).
- No re-seed of the dega-ditta *client* is required — only the template font changed.
- Visual values in Tasks 1–2 are starting points; expect to nudge them in Task 5.
