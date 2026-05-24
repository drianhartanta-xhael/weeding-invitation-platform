# Design: Near-tap-free WhatsApp send + import idempotency + OG preview

Date: 2026-05-24
Branch: feat/floral-watercolor-template
Status: Approved (pending spec review)

## Context

`/dega-ditta` is visually done and wired end-to-end (seed, slot layout, RSVP/wishes/gift,
guest WhatsApp send + smart import). A pre-launch audit surfaced gaps between "design looks
done" and "guests actually receive a working invite." This spec covers the three that are real
code changes; server/domain setup and importing the real guest list happen separately.

## Goals

1. WhatsApp link previews show the couple photo (currently imageless).
2. Guest import never crashes on duplicate names or re-import.
3. Sending invites is near-tap-free from the couple's own number, and "sent" reflects a real send.

## Non-goals

- WhatsApp auto-send via any API (see Decision below).
- Changing the default WA message to Indonesian (#7).
- Empty-venue label check in the Rundown (#9).
- Importing the real guest list (operational; enabled once import is idempotent).

## Decision: manual/semi-auto send, not an API

Explored thoroughly and rejected auto-send for this product:

- Each couple sends from their **own personal WhatsApp number**, per wedding.
- **Official WhatsApp Business API** cannot run on a personal number — it requires a dedicated
  number that leaves the normal WhatsApp app, plus Meta-approved templates and per-message fees.
- **Unofficial automation** (Baileys, whatsapp-web.js) *can* send from the personal number, but
  it violates WhatsApp ToS and risks **banning the couple's wedding-day number**. The library
  choice (Baileys vs whatsapp-web.js) doesn't change ban risk — the risk comes from the bulk
  automated-send behavior, not the tool. It also requires an always-on server holding a per-couple
  session, QR-linking each wedding, reconnect handling, and throttling (so it isn't even fast).

The existing `wa.me` flow already sends from the couple's real number with **zero ban risk** (a
human presses send). So the high-value move is making that flow near-tap-free, not automating it.

## Design A — WhatsApp send flow revamp

File: `apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/SendWhatsAppQueue.tsx`

### States

Per guest: `pending → opened → sent`, plus `skipped` (no valid phone). Initial state derives from
server data: `invitedAt` set → `sent`; no normalizable phone → `skipped`; else `pending`.

### "Advance = confirm previous" (~1 tap per guest)

One primary button drives the queue; its label is dynamic:

- First press: **"Open WhatsApp for {Guest 1}"** → opens the prefilled `wa.me` link, marks Guest 1 `opened`.
- Next press: **"✓ Sent — open {Guest 2}"** → PATCH Guest 1 `invited=true` (sets `invitedAt`),
  opens Guest 2, marks it `opened`.
- Repeats down the pending list. Final guest: **"✓ Mark {last} sent & finish."**

Rationale: the browser cannot detect a real send. Marking a guest `sent` only when the user
*advances past* it is the closest honest signal — and fixes the prior bug where `invitedAt` was
set the instant the tab opened (closing without sending still counted as sent).

### Per-row controls (corrections)

- **✓** mark sent (PATCH), **↻** re-open, **📋** copy message (fallback for desktop / no WhatsApp).

### Why not open many tabs at once

Browsers block all but the first `window.open` per user gesture (popup blocker). Sequential
auto-advance is the popup-safe equivalent of batching.

### Progress, resume, filters

- `invitedAt` persists server-side, so reopening the dialog reconstructs sent-vs-pending — resume is free.
- Add a progress indicator (`X / N sent`), a **"show only pending"** filter, and a **category filter**
  to work a segment at a time.

### Dead-link guard (#2)

If the generated link contains `localhost` (i.e. `NEXT_PUBLIC_INVITATION_URL` not yet pointed at the
production domain), show a warning banner so dead links aren't blasted before deploy. No code change
to the env contract itself — the var is already documented in `apps/web/.env.example`.

## Design B — OG preview photo (#1)

File: `apps/invitation/src/app/[slug]/layout.tsx`

Add `metadataBase: new URL(process.env.NEXT_PUBLIC_INVITATION_URL || 'http://localhost:3001')` to
both the success and fallback `Metadata`. The seed's `groomPhoto` is a relative path
(`/assets/dega-ditta/2.jpg`) served by the invitation app's `/public`; with `metadataBase` set to
the invitation origin, Next.js resolves it to an absolute URL so WhatsApp/social render the photo.

Also add `NEXT_PUBLIC_INVITATION_URL=http://localhost:3001` to `apps/invitation/.env.example`.

## Design C — Import idempotency (#3)

File: `server/src/controllers/guestController.ts` — `bulkCreateGuests` and `bulkUploadGuests`.

Replace `insertMany` with `bulkWrite` upserts keyed on `(clientId, slug)`:

- **Within-batch slug disambiguation:** track slugs seen in the incoming batch; on collision append
  `-2`, `-3`, … so two guests named the same become distinct (`ahmad-rizki`, `ahmad-rizki-2`).
- **Upsert against DB:** `updateOne({ clientId, slug }, { $set: {...} }, { upsert: true })`, unordered.
  Re-importing the same list updates instead of throwing `E11000` + partial insert.
- Return `{ created, updated, guests }` where `guests` = the affected (created + updated) docs.

Frontend: `GuestsTab` `onImported` merges by `_id` (replace existing, prepend new) instead of
blind-prepend, so updated rows don't duplicate in the table.

**Trade-off:** a brand-new person whose name slugifies to an already-imported guest will *update*
that record rather than create a second. Rare for real lists, and editable in the UI. Acceptable vs.
the current crash.

## Verification

- `npm run lint` (type-check) clean.
- Manual: re-import the same CSV twice → no crash, counts reflect updates not duplicates; CSV with
  two identical names → two distinct guests.
- Manual: send queue advances one guest per tap, marks `invitedAt` only on advance; reopening the
  dialog shows already-sent guests; localhost banner appears under local env.
- After deploy: paste a `wa.me` link in WhatsApp → preview card shows the couple photo.
