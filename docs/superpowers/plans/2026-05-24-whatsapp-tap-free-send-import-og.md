# Near-tap-free WhatsApp Send + Import Idempotency + OG Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WhatsApp invites near-tap-free from the couple's own number, stop the guest import from crashing on duplicates/re-import, and make the WhatsApp link preview show the couple photo.

**Architecture:** Three independent changes. (B) adds `metadataBase` to the invitation app so relative OG image paths resolve to absolute URLs. (C) replaces `insertMany` with idempotent `bulkWrite` upserts keyed on `(clientId, slug)` plus within-batch slug disambiguation, and merges results by `_id` in the dashboard. (A) rewrites the send queue into an "advance = confirm previous" flow where each tap marks the prior guest sent and opens the next, with per-row overrides, a pending filter, and a localhost dead-link guard.

**Tech Stack:** Next.js 14 (App Router) for `apps/web` + `apps/invitation`, Express + Mongoose + Zod for `server`, shadcn/ui components, Axios client (`@/lib/api`).

> **Testing note (read first):** This repo has **no test runner** (`CLAUDE.md`: "There are no tests configured yet"). Standard TDD steps are therefore replaced by the repo's own verification gate — `npm run lint` (TypeScript type-check across workspaces) — plus concrete manual checks. This is an intentional, documented deviation from test-first; do **not** scaffold a new test framework for these changes.

---

## File Structure

- `apps/invitation/src/app/[slug]/layout.tsx` — add `metadataBase` (Task 1).
- `apps/invitation/.env.example` — document `NEXT_PUBLIC_INVITATION_URL` (Task 1).
- `server/src/controllers/guestController.ts` — `buildGuestUpserts` helper + idempotent `bulkCreateGuests` / `bulkUploadGuests` (Task 2).
- `apps/web/src/app/(dashboard)/clients/[id]/tabs/GuestsTab.tsx` — `mergeGuests` helper, wire into bulk-add + import (Task 3).
- `apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/ImportGuestsDialog.tsx` — success toast uses created/updated (Task 3).
- `apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/SendWhatsAppQueue.tsx` — full rewrite of the send flow (Task 4).

---

## Task 1: OG preview photo (`metadataBase`)

**Files:**
- Modify: `apps/invitation/src/app/[slug]/layout.tsx`
- Modify: `apps/invitation/.env.example`

- [ ] **Step 1: Add `metadataBase` to both metadata return paths**

In `generateMetadata`, add `metadataBase` to the success-path returned object (the one with `openGraph`/`twitter`). Insert it as the first property:

```ts
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_INVITATION_URL || 'http://localhost:3001'),
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(invitation.groomPhoto && { images: [{ url: invitation.groomPhoto }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(invitation.groomPhoto && { images: [invitation.groomPhoto] }),
      },
    };
```

And add it to the `catch` fallback return as well:

```ts
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_INVITATION_URL || 'http://localhost:3001'),
      title: 'Wedding Invitation',
      description: 'You are cordially invited.',
    };
```

- [ ] **Step 2: Document the env var**

Append to `apps/invitation/.env.example`:

```
# Public base URL of this invitation app. Used as metadataBase so OG / WhatsApp
# link previews resolve relative image paths (e.g. /assets/...) to absolute URLs.
NEXT_PUBLIC_INVITATION_URL=http://localhost:3001
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: PASS (no type errors).

- [ ] **Step 4: Manual verify (optional, local)**

With `apps/invitation` running, view source of `http://localhost:3001/dega-ditta` and confirm the `og:image` meta is an **absolute** URL (`http://localhost:3001/assets/dega-ditta/2.jpg`), not a relative path. (Full WhatsApp preview is only verifiable after the prod domain is set.)

- [ ] **Step 5: Commit**

```bash
git add apps/invitation/src/app/[slug]/layout.tsx apps/invitation/.env.example
git commit -m "fix(invitation): set metadataBase so OG/WhatsApp preview resolves couple photo"
```

---

## Task 2: Idempotent guest import (server)

**Files:**
- Modify: `server/src/controllers/guestController.ts`

- [ ] **Step 1: Add the `buildGuestUpserts` helper**

Place it directly below the existing `slugify` function (around line 117), reusing that `slugify`:

```ts
// Build idempotent upsert ops keyed on (clientId, slug). Duplicate slugs within
// the SAME batch are disambiguated (ahmad-rizki, ahmad-rizki-2, ...) so two guests
// with the same name become distinct. Re-importing the same list updates instead
// of throwing a duplicate-key error.
function buildGuestUpserts(
  clientId: string,
  guestsData: Array<Record<string, any>>
): { ops: any[]; slugs: string[] } {
  const seen = new Set<string>();
  const slugs: string[] = [];
  const ops = guestsData.map((g) => {
    const base = (g.slug && String(g.slug).trim()) || slugify(g.name) || 'guest';
    let candidate = base;
    let n = 2;
    while (seen.has(candidate)) candidate = `${base}-${n++}`;
    seen.add(candidate);
    slugs.push(candidate);
    return {
      updateOne: {
        filter: { clientId, slug: candidate },
        update: { $set: { ...g, slug: candidate, clientId } },
        upsert: true,
      },
    };
  });
  return { ops, slugs };
}
```

- [ ] **Step 2: Rewrite `bulkCreateGuests` to upsert**

Replace the body of `bulkCreateGuests` (the `try` block contents) with:

```ts
    const { clientId } = req.params;
    const guestsData = bulkGuestSchema.parse(req.body.guests);

    const { ops, slugs } = buildGuestUpserts(clientId, guestsData);
    const result = await Guest.bulkWrite(ops, { ordered: false });
    const guests = await Guest.find({ clientId, slug: { $in: slugs } }).sort({ createdAt: -1 });

    res.status(201).json({
      message: `${result.upsertedCount} added, ${result.matchedCount} updated`,
      created: result.upsertedCount,
      updated: result.matchedCount,
      guests,
    });
```

- [ ] **Step 3: Rewrite the tail of `bulkUploadGuests` to upsert**

In `bulkUploadGuests`, after `const validated = bulkGuestSchema.parse(guestsData);`, replace the `insertMany` + response block with:

```ts
    const { ops, slugs } = buildGuestUpserts(clientId, validated);
    const result = await Guest.bulkWrite(ops, { ordered: false });
    const guests = await Guest.find({ clientId, slug: { $in: slugs } }).sort({ createdAt: -1 });

    res.status(201).json({
      message: `${result.upsertedCount} imported, ${result.matchedCount} updated`,
      created: result.upsertedCount,
      updated: result.matchedCount,
      guests,
    });
```

- [ ] **Step 4: Type-check the server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS. (`Guest.bulkWrite(ops)` accepts `any[]`; `result.upsertedCount` / `result.matchedCount` are numbers on the Mongo `BulkWriteResult`.)

- [ ] **Step 5: Manual verify**

With Mongo + server running and an authenticated token:
1. `POST /api/guests/bulk/:clientId` with `{ "guests": [{ "name": "Ahmad Rizki", "invitationName": "Ahmad", "slug": "ahmad-rizki", "phone": "0812", "category": "friend" }, { "name": "Ahmad Rizki", "invitationName": "Ahmad 2", "slug": "ahmad-rizki", "phone": "0813", "category": "friend" }] }` → **201**, response `created: 2`, and two distinct guests exist (`ahmad-rizki`, `ahmad-rizki-2`). No `E11000`.
2. Repeat the exact same request → **201**, `created: 0, updated: 2`, still only two guests.

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/guestController.ts
git commit -m "fix(guests): idempotent bulk import via upsert + slug disambiguation"
```

---

## Task 3: Merge import results by `_id` (web dashboard)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/clients/[id]/tabs/GuestsTab.tsx`
- Modify: `apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/ImportGuestsDialog.tsx`

> Depends on Task 2's response shape (`{ created, updated, guests }`). With upsert, returned guests may already be in the table, so blind-prepend would duplicate rows.

- [ ] **Step 1: Add a `mergeGuests` helper in `GuestsTab`**

Directly below the existing `replaceGuest` definition (around line 131), add:

```ts
  const mergeGuests = (incoming: Guest[]) =>
    setGuests((prev) => {
      const ids = new Set(incoming.map((g) => g._id));
      return [...incoming, ...prev.filter((g) => !ids.has(g._id))];
    });
```

- [ ] **Step 2: Use it in `handleBulkSubmit`**

In `handleBulkSubmit`, replace these three lines:

```ts
      const { data } = await api.post(`/guests/bulk/${client._id}`, { guests: payload });
      setGuests([...data.guests, ...guests]);
      setBulkRows([{ ...EMPTY_BULK_ROW }]);
      setShowBulkAdd(false);
      setSuccess(`${data.guests.length} guests added`);
```

with:

```ts
      const { data } = await api.post(`/guests/bulk/${client._id}`, { guests: payload });
      mergeGuests(data.guests);
      setBulkRows([{ ...EMPTY_BULK_ROW }]);
      setShowBulkAdd(false);
      setSuccess(`${data.created} added${data.updated ? `, ${data.updated} updated` : ''}`);
```

- [ ] **Step 3: Use it for the Import dialog callback**

Change the `ImportGuestsDialog` `onImported` prop (around line 442) from:

```tsx
          onImported={(gs) => setGuests((prev) => [...gs, ...prev])}
```

to:

```tsx
          onImported={(gs) => mergeGuests(gs)}
```

- [ ] **Step 4: Update the Import dialog success toast**

In `ImportGuestsDialog.tsx` `doImport`, replace:

```ts
      const { data } = await api.post(`/guests/bulk/${clientId}`, { guests: preview });
      onImported(data.guests);
      setSuccess(`${data.guests.length} guests imported`);
```

with:

```ts
      const { data } = await api.post(`/guests/bulk/${clientId}`, { guests: preview });
      onImported(data.guests);
      setSuccess(`${data.created} imported${data.updated ? `, ${data.updated} updated` : ''}`);
```

- [ ] **Step 5: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 6: Manual verify**

In the dashboard Guests tab: import a CSV, then re-import the same CSV. The table shows each guest **once** (updated, not duplicated), and the success toast reads e.g. "0 imported, N updated".

- [ ] **Step 7: Commit**

```bash
git add "apps/web/src/app/(dashboard)/clients/[id]/tabs/GuestsTab.tsx" "apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/ImportGuestsDialog.tsx"
git commit -m "fix(guests): merge bulk/import results by _id; show added/updated counts"
```

---

## Task 4: Near-tap-free send queue

**Files:**
- Modify (full rewrite): `apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/SendWhatsAppQueue.tsx`

> The dialog receives only the **selected** guests (`guests={selectedGuests}` in `GuestsTab`), so scoping is done by table selection — no in-dialog category filter needed. Statuses re-initialise each time the dialog opens (so reopening resumes from server `invitedAt`).

- [ ] **Step 1: Replace the whole file**

Overwrite `SendWhatsAppQueue.tsx` with:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import type { Client, Guest } from '../../types';
import { DEFAULT_WA_TEMPLATE, buildWaMessage, invitationUrl, normalizePhone, waLink } from '../../helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SendStatus = 'pending' | 'opened' | 'sent' | 'skipped';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  guests: Guest[];
  onGuestUpdated: (guest: Guest) => void;
}

export default function SendWhatsAppQueue({ open, onOpenChange, client, guests, onGuestUpdated }: Props) {
  const templateKey = `wa-template-${client._id}`;
  const [template, setTemplate] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_WA_TEMPLATE;
    return window.localStorage.getItem(templateKey) || DEFAULT_WA_TEMPLATE;
  });
  const [status, setStatus] = useState<Record<string, SendStatus>>({});
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const couple = `${client.groomName} & ${client.brideName}`;
  const guestIdsKey = guests.map((g) => g._id).join(',');

  // (Re)initialise statuses whenever the dialog opens or the selection changes.
  // invitedAt persists server-side, so reopening resumes where you left off.
  useEffect(() => {
    if (!open) return;
    const init: Record<string, SendStatus> = {};
    for (const g of guests) {
      init[g._id] = !normalizePhone(g.phone) ? 'skipped' : g.invitedAt ? 'sent' : 'pending';
    }
    setStatus(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guestIdsKey]);

  const messageFor = (g: Guest) =>
    buildWaMessage(template, {
      invitationName: g.invitationName,
      couple,
      link: invitationUrl(client.slug, g.slug),
    });

  const updateTemplate = (val: string) => {
    setTemplate(val);
    if (typeof window !== 'undefined') window.localStorage.setItem(templateKey, val);
  };

  const sentCount = useMemo(() => guests.filter((g) => status[g._id] === 'sent').length, [guests, status]);
  const openedGuest = guests.find((g) => status[g._id] === 'opened');
  const nextPending = guests.find((g) => status[g._id] === 'pending');

  const markSent = async (g: Guest) => {
    setStatus((s) => ({ ...s, [g._id]: 'sent' }));
    try {
      const { data } = await api.patch(`/guests/${g._id}/invited`, { invited: true });
      onGuestUpdated(data.guest);
    } catch {
      /* optimistic UI already updated */
    }
  };

  const openOne = (g: Guest) => {
    if (!normalizePhone(g.phone)) return;
    window.open(waLink(g.phone, messageFor(g)), '_blank');
    setStatus((s) => ({ ...s, [g._id]: 'opened' }));
  };

  // Primary queue action: confirm the currently-opened guest as sent, then open the next pending one.
  // Each tap therefore means "I sent that one — open the next".
  const advance = async () => {
    if (openedGuest) await markSent(openedGuest);
    if (nextPending) openOne(nextPending);
  };

  const copyMessage = (g: Guest) => {
    navigator.clipboard.writeText(messageFor(g));
  };

  const advanceLabel = nextPending
    ? openedGuest
      ? `✓ Sent — open ${nextPending.invitationName}`
      : `Open WhatsApp for ${nextPending.invitationName}`
    : openedGuest
      ? `✓ Mark ${openedGuest.invitationName} sent & finish`
      : 'All done';

  const sampleLink = guests[0] ? invitationUrl(client.slug, guests[0].slug) : '';
  const isLocalhost = sampleLink.includes('localhost');

  const visibleGuests = showOnlyPending
    ? guests.filter((g) => status[g._id] === 'pending' || status[g._id] === 'opened')
    : guests;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send WhatsApp ({guests.length})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLocalhost && (
            <div className="rounded-md border border-amber-500/50 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
              ⚠ Links point to <code>localhost</code>. Set <code>NEXT_PUBLIC_INVITATION_URL</code> to the live domain before sending, or guests get dead links.
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Message</p>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => updateTemplate(DEFAULT_WA_TEMPLATE)}>
                Reset
              </Button>
            </div>
            <textarea
              value={template}
              onChange={(e) => updateTemplate(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            />
            <p className="text-[11px] text-muted-foreground">
              Placeholders: <code>{'{invitationName}'}</code> <code>{'{couple}'}</code> <code>{'{link}'}</code>
            </p>
            {guests[0] && (
              <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">
                Preview: {messageFor(guests[0])}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{sentCount} / {guests.length} sent</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowOnlyPending((v) => !v)}>
                {showOnlyPending ? 'Show all' : 'Show only pending'}
              </Button>
              <Button size="sm" disabled={!openedGuest && !nextPending} onClick={advance}>
                {advanceLabel}
              </Button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
            {visibleGuests.map((g) => {
              const st = status[g._id];
              const phone = normalizePhone(g.phone);
              return (
                <div key={g._id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{g.invitationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {phone ? `+${phone}` : <span className="text-destructive">no phone</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={
                        st === 'sent'
                          ? 'text-xs text-green-600'
                          : st === 'opened'
                            ? 'text-xs text-amber-600'
                            : st === 'skipped'
                              ? 'text-xs text-destructive'
                              : 'text-xs text-muted-foreground'
                      }
                    >
                      {st}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={!phone} onClick={() => copyMessage(g)} title="Copy message">
                      Copy
                    </Button>
                    {st !== 'sent' && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-600" disabled={!phone} onClick={() => markSent(g)}>
                        ✓ Sent
                      </Button>
                    )}
                    <Button size="sm" variant={st === 'sent' ? 'outline' : 'default'} className="h-7 px-2 text-xs" disabled={!phone} onClick={() => openOne(g)}>
                      {st === 'sent' || st === 'opened' ? 'Re-open' : 'Open'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Manual verify**

In the Guests tab, select a few guests (at least one without a phone) and click "Send WhatsApp":
1. The primary button reads "Open WhatsApp for {first}". Click → a WhatsApp tab opens prefilled; that row shows `opened` (amber); button now reads "✓ Sent — open {next}".
2. Click again → previous row flips to `sent` (green), `X / N sent` increments, next opens.
3. The no-phone guest shows `skipped` with disabled buttons.
4. Close and reopen the dialog → already-sent guests still show `sent` (resume works).
5. Toggle "Show only pending" → sent guests hide.
6. If running locally, the amber localhost banner is visible.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/SendWhatsAppQueue.tsx"
git commit -m "feat(guests): near-tap-free send queue (advance=confirm previous, mark-sent, pending filter, localhost guard)"
```

---

## Final verification

- [ ] Run `npm run lint` once more from the repo root — whole monorepo type-checks clean.
- [ ] Confirm all four commits are present on `feat/floral-watercolor-template`.

---

## Self-Review (completed by plan author)

- **Spec coverage:** Design A → Task 4 (advance model, per-row, pending filter, localhost guard, mark-sent). Design B → Task 1. Design C → Task 2 (server upsert + disambiguation) + Task 3 (frontend merge). #4 (real list) is operational, no task, as specced. #7/#9 explicitly out of scope. ✓
- **Placeholder scan:** No TBD/TODO; every code step shows full code. ✓
- **Type consistency:** `SendStatus` union, `{ created, updated, guests }` response shape, and `mergeGuests(incoming: Guest[])` are used consistently across Tasks 2–4. `buildGuestUpserts` returns `{ ops, slugs }` and both controllers consume both. ✓
- **Deviation:** TDD test-first replaced with `npm run lint` + manual verification because the repo has no test runner (documented at top).
