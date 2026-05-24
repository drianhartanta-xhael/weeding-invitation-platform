# Guest WhatsApp Send + Smart Import Design Spec

**Date:** 2026-05-24
**Area:** Admin app — client detail → Guests tab (`apps/web`)
**Scope:** Send invitation links to guests via WhatsApp (per-guest + bulk-selected), and import guests from a downloadable template or a raw contacts export (with column mapping).

## Goal

Let the admin reach guests and load them efficiently, entirely from the Guests tab:
1. Send each guest their **personalized invitation link** via WhatsApp — individually, or to a bulk selection via a guided sequential queue.
2. Import guests from either a **clean downloadable CSV template** or a **raw contacts export** (e.g. Google/phone contacts) by mapping its columns to guest fields.

## Key constraint / decision summary

- **Frontend-only.** The existing `POST /guests/bulk/:clientId` endpoint already accepts the import payload, and WhatsApp uses `wa.me` deep links. **No server, DB, or `@wedding/shared` changes.**
- **Bulk WhatsApp = sequential click-through queue.** WhatsApp's free tier opens one chat per user click; true blasting needs the paid Business API and risks bans. Each "open" is a real click (one tab), so browsers don't block it.
- **Message template = editable textarea in the send modal**, default provided in code, the edited version remembered **per-client in `localStorage`**. No persisted DB field in v1.
- **Link base URL = `process.env.NEXT_PUBLIC_INVITATION_BASE_URL`** (admin app), fallback `http://localhost:3001`. The links only resolve for real once the invitation app is deployed; the feature is fully buildable/testable now.
- **"Sent" status is session-only** in v1 (client state). Persisting an `invitedAt` per guest is a documented future enhancement.

## Components / files

All under `apps/web/src/app/(dashboard)/clients/[id]/`.

| File | Change |
| --- | --- |
| `helpers.ts` | Add `normalizePhone`, `invitationUrl`, `waLink`, `buildWaMessage`, and `DEFAULT_WA_TEMPLATE`. |
| `tabs/GuestsTab.tsx` | Add a checkbox column + select-all; per-row **WhatsApp** + **Copy link** actions; a **Send WhatsApp (N)** button opening the queue modal; replace the inline CSV block with the new import dialog. |
| `tabs/guests/SendWhatsAppQueue.tsx` *(new)* | The bulk sequential-send modal. |
| `tabs/guests/ImportGuestsDialog.tsx` *(new)* | Template download + smart upload (auto-detect → mapping → preview → import). |
| `apps/web/.env.example` | Document `NEXT_PUBLIC_INVITATION_BASE_URL`. |

Extracting the queue and import into their own files keeps `GuestsTab.tsx` (already ~420 lines) from growing unwieldy.

## A. Helpers (`helpers.ts`)

- `normalizePhone(raw: string): string` — drop the leading `+` and all non-digits; if the result starts with `0`, replace that leading `0` with `62`; otherwise keep as-is (assume it already carries a country code, e.g. `62…`). Return `''` if fewer than ~8 digits (treated as "no valid phone"). Examples: `08123456789` → `628123456789`; `+62 812-3456-789` → `628123456789`.
- `invitationUrl(clientSlug, guestSlug)` — `` `${BASE}/${clientSlug}?to=${guestSlug}` `` where `BASE = process.env.NEXT_PUBLIC_INVITATION_BASE_URL || 'http://localhost:3001'`.
- `buildWaMessage(template, { invitationName, couple, link })` — replace `{invitationName}`, `{couple}`, `{link}` tokens.
- `waLink(phone, message)` — `` `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}` ``.
- `DEFAULT_WA_TEMPLATE` — a sensible default, e.g.:
  `"Dear {invitationName}, you're warmly invited to {couple}'s wedding. Please open your personal invitation here: {link}"`.

`couple` is built from `client.groomName` + `client.brideName` (`${groomName} & ${brideName}`).

## B. WhatsApp send

**Per-guest (table Actions column):**
- **WhatsApp** button — opens `waLink(g.phone, buildWaMessage(template, …))` in a new tab. Disabled (with a tooltip/dim) when `normalizePhone(g.phone)` is empty.
- **Copy link** button — copies `invitationUrl(client.slug, g.slug)` to clipboard; brief "Copied" feedback.
- The template used is the per-client `localStorage` value (or default).

**Selection:**
- A checkbox column; a header checkbox toggles all guests on the current page. Selected `_id`s held in a `Set<string>` in `GuestsTab` state.
- When ≥1 selected, show **Send WhatsApp (N)** in the toolbar.

**Send Queue modal (`SendWhatsAppQueue.tsx`):**
- Props: `client`, `guests` (the selected subset), `onClose`.
- Top: an editable **message textarea** seeded from `localStorage[`wa-template-${client._id}`]` or `DEFAULT_WA_TEMPLATE`; a small legend of placeholders; "Reset to default". Edits are saved to `localStorage` on change.
- A live **preview** of the filled message for the first guest.
- A list of the selected guests; each shows name, normalized phone (or a red "no phone" tag), and a status chip: `pending` / `sent` / `skipped`. A per-row **Open** button opens that guest's `waLink` in a new tab and marks them `sent`, then highlights the next `pending`.
- An **Open next** stepper button (acts on the current pending guest) and a `X / N sent` progress indicator. Guests with no valid phone are auto-marked `skipped`.
- Status is component state only (resets when the modal closes) — v1 does not persist who was sent.

## C. Smart import (`ImportGuestsDialog.tsx`)

Replaces the current inline `showCsvUpload` block; `handleExportCSV` stays as-is.

- **Download template** — generates `guest-template.csv` with header `name,invitationName,phone,category` and one example row, via a Blob download (same technique as `handleExportCSV`).
- **Upload** any `.csv` → `Papa.parse(file, { header: true, skipEmptyLines: true })`. Read the raw column names from `results.meta.fields`.
- **Auto-detect** maps each target field to a best-guess source column (case-insensitive):
  - Name: `name`, `full name`, `display name`; else combine `first name` + `last name` if both present.
  - Phone: `phone`, `mobile`, `phone 1 - value`, `whatsapp`, `no hp`, `nomor`.
  - Invitation name: `invitationname`, `invitation name`; default → same as Name.
  - Category: `category`; default → `other`.
- **Mapping UI** — for each target field (Name\*, Invitation name, Phone, Category) a `Select` listing the CSV columns (plus a `— none —` option), pre-filled from auto-detect. Name is required.
- **Preview** — apply the mapping to produce `BulkGuestRow[]` (`name`, `invitationName` fallback = name, `slug` = `slugify(name)`, `phone` = normalized, `category` or `other`), shown in a table (reuse the existing preview table). Rows without a name are dropped.
- **Import N guests** → `POST /guests/bulk/${client._id}` (unchanged), then prepend to the list and toast success (same as `handleCsvSubmit`).

## Data flow

```
Contacts export CSV ─Papa.parse─▶ raw columns ─auto-detect+mapping─▶ BulkGuestRow[] ─▶ POST /guests/bulk ─▶ Guest[]
Guest row ─normalizePhone + buildWaMessage─▶ wa.me deep link ─(new tab)─▶ WhatsApp
```

## Out of scope (future)

- Persisting per-guest "invited/sent" status (`invitedAt`) and a sent/not-sent filter.
- Persisting the message template server-side (per-client DB field) or a dedicated template editor.
- True automated bulk send (WhatsApp Business API) — paid, separate spec.
- vCard (`.vcf`) import; only CSV is supported here.
- Per-client custom invitation domain (the env base URL covers v1).

## Verification

1. `npm run lint` (TypeScript type-check) passes.
2. With the admin app on `:3000`, in a client's Guests tab:
   - A guest row's **WhatsApp** button has an `href`/opens `https://wa.me/62...?text=...` with the message containing the correct `?to=<slug>` link; disabled when no phone.
   - **Copy link** copies the `invitationUrl`.
   - Selecting guests → **Send WhatsApp (N)** → queue modal: editing the message persists across reopen (localStorage); **Open** marks sent and advances; no-phone guests show as skipped.
   - **Download template** yields a CSV with the documented headers.
   - Uploading a messy sample CSV (Google-contacts-style headers) auto-detects, lets you map, previews normalized rows, and imports via `/guests/bulk`.
3. No server or `@wedding/shared` files changed.
