# Guest WhatsApp Send + Smart Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From the admin Guests tab, send each guest their personalized invitation link via WhatsApp (per-guest + a bulk sequential queue), import guests from a clean template or a raw contacts export (column mapping), and persist a per-guest "invited" status.

**Architecture:** Mostly admin-frontend. Import reuses the existing `POST /guests/bulk/:clientId`; WhatsApp uses `wa.me` deep links built client-side. One small server addition persists invited status: a `Guest.invitedAt` field + `PATCH /guests/:id/invited`. Two new focused components (`SendWhatsAppQueue`, `ImportGuestsDialog`) keep `GuestsTab` from bloating.

**Tech Stack:** Express + Mongoose (server); Next.js 14 + shadcn/ui + papaparse (admin `apps/web`); Playwright MCP for verification.

**Testing note:** No test framework in this repo (per `CLAUDE.md`). Per-task verification is `npx tsc --noEmit` (per workspace); end-to-end verification is an authenticated API probe + Playwright on the admin app.

**Spec:** `docs/superpowers/specs/2026-05-24-guest-whatsapp-send-smart-import-design.md`

---

## File Structure

Server (`server/`):
- `src/models/Guest.ts` — add `invitedAt`.
- `src/controllers/guestController.ts` — add `markInvited`.
- `src/routes/guests.ts` — register `PATCH /:id/invited`.

Admin (`apps/web/src/app/(dashboard)/clients/[id]/`):
- `types.ts` — add `invitedAt` to `Guest`.
- `helpers.ts` — add phone/link/message helpers + default template.
- `tabs/guests/SendWhatsAppQueue.tsx` *(new)* — bulk sequential send modal.
- `tabs/guests/ImportGuestsDialog.tsx` *(new)* — template download + mapped import.
- `tabs/GuestsTab.tsx` — checkboxes, per-row actions, invited badge, wire the two dialogs.
- `apps/web/.env.example` — document `NEXT_PUBLIC_INVITATION_BASE_URL`.

---

## Task 1: Server — `Guest.invitedAt` + mark-invited endpoint

**Files:** `server/src/models/Guest.ts`, `server/src/controllers/guestController.ts`, `server/src/routes/guests.ts`

- [ ] **Step 1: Add `invitedAt` to the Guest model**

In `server/src/models/Guest.ts`, add to the `IGuestDocument` interface, after `rsvpDate: Date | null;`:

```ts
  rsvpDate: Date | null;
  invitedAt: Date | null;
  createdAt: Date;
```

And in the schema, after the `rsvpDate` block (before the closing `}` of the fields object):

```ts
    rsvpDate: {
      type: Date,
      default: null,
    },
    invitedAt: {
      type: Date,
      default: null,
    },
```

- [ ] **Step 2: Add the `markInvited` controller**

In `server/src/controllers/guestController.ts`, append this export (after `submitRSVP` or at the end of the file, before any trailing exports):

```ts
export const markInvited = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invited = req.body?.invited === true;
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { invitedAt: invited ? new Date() : null },
      { new: true }
    );
    if (!guest) {
      res.status(404).json({ message: 'Guest not found' });
      return;
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 3: Register the route**

In `server/src/routes/guests.ts`, add `markInvited` to the import list from `../controllers/guestController`:

```ts
import {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  bulkCreateGuests,
  bulkUploadGuests,
  submitRSVP,
  markInvited,
} from '../controllers/guestController';
```

And add this admin route after the `router.put('/:id', authenticate, updateGuest);` line:

```ts
router.patch('/:id/invited', authenticate, markInvited);
```

- [ ] **Step 4: Type-check**

Run: `cd server && npx tsc --noEmit`
Expected: no type errors (exits silently).

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Guest.ts server/src/controllers/guestController.ts server/src/routes/guests.ts
git commit -m "feat(guests): add invitedAt + PATCH /guests/:id/invited endpoint"
```

---

## Task 2: Admin — Guest type + WhatsApp/link helpers

**Files:** `apps/web/src/app/(dashboard)/clients/[id]/types.ts`, `apps/web/src/app/(dashboard)/clients/[id]/helpers.ts`

- [ ] **Step 1: Add `invitedAt` to the admin `Guest` type**

In `types.ts`, replace the `Guest` interface:

```ts
export interface Guest {
  _id: string;
  name: string;
  invitationName: string;
  slug: string;
  phone: string;
  email: string;
  category: GuestCategory;
  rsvpStatus: 'pending' | 'attending' | 'notAttending';
  numberOfGuests: number;
}
```

with:

```ts
export interface Guest {
  _id: string;
  name: string;
  invitationName: string;
  slug: string;
  phone: string;
  email: string;
  category: GuestCategory;
  rsvpStatus: 'pending' | 'attending' | 'notAttending';
  numberOfGuests: number;
  invitedAt?: string | null;
}
```

- [ ] **Step 2: Add helpers**

In `helpers.ts`, append at the end of the file:

```ts
export const DEFAULT_WA_TEMPLATE =
  "Dear {invitationName}, you're warmly invited to {couple}'s wedding. Please open your personal invitation here: {link}";

const INVITATION_BASE_URL =
  process.env.NEXT_PUBLIC_INVITATION_BASE_URL || 'http://localhost:3001';

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  return digits.length >= 8 ? digits : '';
}

export function invitationUrl(clientSlug: string, guestSlug: string): string {
  return `${INVITATION_BASE_URL}/${clientSlug}?to=${encodeURIComponent(guestSlug)}`;
}

export function buildWaMessage(
  template: string,
  vars: { invitationName: string; couple: string; link: string }
): string {
  return template
    .replace(/\{invitationName\}/g, vars.invitationName)
    .replace(/\{couple\}/g, vars.couple)
    .replace(/\{link\}/g, vars.link);
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 3: Type-check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(dashboard)/clients/[id]/types.ts" "apps/web/src/app/(dashboard)/clients/[id]/helpers.ts"
git commit -m "feat(guests): invitedAt type + WhatsApp/link helpers"
```

---

## Task 3: Admin — `SendWhatsAppQueue` component

**Files:** Create `apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/SendWhatsAppQueue.tsx`

- [ ] **Step 1: Create the component**

Create the file with exactly:

```tsx
'use client';

import { useMemo, useState } from 'react';
import api from '@/lib/api';
import type { Client, Guest } from '../../types';
import { DEFAULT_WA_TEMPLATE, buildWaMessage, invitationUrl, normalizePhone, waLink } from '../../helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SendStatus = 'pending' | 'sent' | 'skipped';

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
  const [status, setStatus] = useState<Record<string, SendStatus>>(() => {
    const init: Record<string, SendStatus> = {};
    for (const g of guests) {
      init[g._id] = !normalizePhone(g.phone) ? 'skipped' : g.invitedAt ? 'sent' : 'pending';
    }
    return init;
  });

  const couple = `${client.groomName} & ${client.brideName}`;

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
  const nextPending = guests.find((g) => status[g._id] === 'pending');

  const sendOne = async (g: Guest) => {
    if (!normalizePhone(g.phone)) return;
    window.open(waLink(g.phone, messageFor(g)), '_blank');
    setStatus((s) => ({ ...s, [g._id]: 'sent' }));
    try {
      const { data } = await api.patch(`/guests/${g._id}/invited`, { invited: true });
      onGuestUpdated(data.guest);
    } catch {
      /* optimistic UI already updated */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send WhatsApp ({guests.length})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{sentCount} / {guests.length} sent</p>
            <Button size="sm" disabled={!nextPending} onClick={() => nextPending && sendOne(nextPending)}>
              {nextPending ? 'Open next' : 'All done'}
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
            {guests.map((g) => {
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
                  <div className="flex items-center gap-2">
                    <span className={st === 'sent' ? 'text-xs text-green-600' : st === 'skipped' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                      {st}
                    </span>
                    <Button size="sm" variant={st === 'sent' ? 'outline' : 'default'} disabled={!phone} onClick={() => sendOne(g)}>
                      {st === 'sent' ? 'Re-open' : 'Open'}
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

Run: `cd apps/web && npx tsc --noEmit`
Expected: no type errors. (The file is a valid module even though not yet imported.)

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/SendWhatsAppQueue.tsx"
git commit -m "feat(guests): SendWhatsAppQueue sequential send modal"
```

---

## Task 4: Admin — `ImportGuestsDialog` component

**Files:** Create `apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/ImportGuestsDialog.tsx`

- [ ] **Step 1: Create the component**

Create the file with exactly:

```tsx
'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import api from '@/lib/api';
import type { BulkGuestRow, Guest, GuestCategory } from '../../types';
import { slugify, normalizePhone, categoryLabel } from '../../helpers';
import { GUEST_CATEGORIES } from '../../constants';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onImported: (guests: Guest[]) => void;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

const NONE = '__none__';
const FIRSTLAST = '__firstlast__';
type TargetField = 'name' | 'invitationName' | 'phone' | 'category';

function detect(columns: string[], candidates: string[]): string {
  const lower = columns.map((c) => c.toLowerCase().trim());
  const idx = lower.findIndex((c) => candidates.includes(c));
  return idx >= 0 ? columns[idx] : '';
}

export default function ImportGuestsDialog({ open, onOpenChange, clientId, onImported, setError, setSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<TargetField, string>>({
    name: '', invitationName: NONE, phone: NONE, category: NONE,
  });

  const firstCol = detect(columns, ['first name']);
  const lastCol = detect(columns, ['last name']);
  const hasFirstLast = firstCol !== '' && lastCol !== '';

  const downloadTemplate = () => {
    const csv = 'name,invitationName,phone,category\nJohn Doe,Mr. & Mrs. Doe,08123456789,friend\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = (res.meta.fields || []).filter(Boolean) as string[];
        setColumns(cols);
        setRows(res.data);
        const nameCol = detect(cols, ['name', 'full name', 'display name', 'nama']);
        const fl = detect(cols, ['first name']) && detect(cols, ['last name']);
        setMapping({
          name: nameCol || (fl ? FIRSTLAST : ''),
          invitationName: detect(cols, ['invitationname', 'invitation name']) || NONE,
          phone: detect(cols, ['phone', 'mobile', 'phone 1 - value', 'whatsapp', 'no hp', 'nomor']) || NONE,
          category: detect(cols, ['category', 'kategori']) || NONE,
        });
      },
    });
  };

  const cellOf = (row: Record<string, string>, col: string): string => {
    if (col === FIRSTLAST) {
      return [row[firstCol], row[lastCol]].filter(Boolean).join(' ').trim();
    }
    if (!col || col === NONE) return '';
    return (row[col] || '').trim();
  };

  const preview: BulkGuestRow[] = rows
    .map((row) => {
      const name = cellOf(row, mapping.name);
      const invitationName = cellOf(row, mapping.invitationName) || name;
      const rawPhone = cellOf(row, mapping.phone);
      const np = normalizePhone(rawPhone);
      const catRaw = cellOf(row, mapping.category).toLowerCase();
      const category = (GUEST_CATEGORIES.some((c) => c.value === catRaw) ? catRaw : 'other') as GuestCategory;
      return { name, invitationName, slug: slugify(name), phone: np || rawPhone, category };
    })
    .filter((r) => r.name);

  const doImport = async () => {
    if (preview.length === 0) return;
    try {
      const { data } = await api.post(`/guests/bulk/${clientId}`, { guests: preview });
      onImported(data.guests);
      setSuccess(`${data.guests.length} guests imported`);
      setTimeout(() => setSuccess(''), 3000);
      setColumns([]);
      setRows([]);
      if (fileRef.current) fileRef.current.value = '';
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import guests');
    }
  };

  const fieldSelect = (field: TargetField, label: string, required = false) => (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}{required && ' *'}</label>
      <Select value={mapping[field] || NONE} onValueChange={(v) => setMapping((m) => ({ ...m, [field]: v }))}>
        <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value={NONE}>— none —</SelectItem>}
          {field === 'name' && hasFirstLast && <SelectItem value={FIRSTLAST}>First + Last name</SelectItem>}
          {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import guests</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>Download template</Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:text-sm file:bg-background hover:file:bg-muted"
            />
          </div>

          {columns.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">Map your columns to guest fields:</p>
              <div className="grid grid-cols-2 gap-3">
                {fieldSelect('name', 'Name', true)}
                {fieldSelect('invitationName', 'Invitation name')}
                {fieldSelect('phone', 'Phone')}
                {fieldSelect('category', 'Category')}
              </div>

              {preview.length > 0 ? (
                <>
                  <p className="text-sm font-medium">{preview.length} guests ready:</p>
                  <div className="max-h-60 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Invitation</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 50).map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.name}</TableCell>
                            <TableCell className="text-muted-foreground">{r.invitationName}</TableCell>
                            <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                            <TableCell>{categoryLabel(r.category)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button size="sm" onClick={doImport}>Import {preview.length} guests</Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Map a Name column to see a preview.</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/clients/[id]/tabs/guests/ImportGuestsDialog.tsx"
git commit -m "feat(guests): ImportGuestsDialog with template + column mapping"
```

---

## Task 5: Admin — wire `GuestsTab` (selection, row actions, dialogs)

**Files:** `apps/web/src/app/(dashboard)/clients/[id]/tabs/GuestsTab.tsx`

- [ ] **Step 1: Update imports**

Add to the existing import block (after the `Checkbox`-less imports). First add a Checkbox import — replace the line `import { Badge } from '@/components/ui/badge';` with:

```tsx
import { Badge } from '@/components/ui/badge';
import SendWhatsAppQueue from './guests/SendWhatsAppQueue';
import ImportGuestsDialog from './guests/ImportGuestsDialog';
import { DEFAULT_WA_TEMPLATE, buildWaMessage, invitationUrl, normalizePhone, waLink } from '../helpers';
```

(Selection uses a native checkbox `<input>` — there is no shadcn `Checkbox` primitive in this project and we don't add the radix dependency.)

And update the existing helpers import line `import { categoryLabel, slugify } from '../helpers';` to just:

```tsx
import { categoryLabel, slugify } from '../helpers';
```

(unchanged — the new helpers are imported on their own line above).

- [ ] **Step 2: Replace CSV-upload state/handlers with import + selection + queue state**

Remove these now-unused pieces: the `showCsvUpload`, `csvPreview`, `fileInputRef` state (lines ~38-40), and the `handleCsvSelect` and `handleCsvSubmit` functions (lines ~129-162).

Replace the block:

```tsx
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvPreview, setCsvPreview] = useState<BulkGuestRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
```

with:

```tsx
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showQueue, setShowQueue] = useState(false);
  const [page, setPage] = useState(1);
```

Then delete the entire `handleCsvSelect` and `handleCsvSubmit` functions (the two `const handleCsv... = ...` blocks). `Papa` and `useRef` may become unused in this file — remove `import Papa from 'papaparse';` and drop `useRef` from the React import if no longer used.

- [ ] **Step 3: Add selection + WhatsApp helpers (inside the component, after `handleDeleteGuest`)**

```tsx
  const replaceGuest = (updated: Guest) =>
    setGuests((gs) => gs.map((g) => (g._id === updated._id ? updated : g)));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectPage = () => {
    const ids = paginatedGuests.map((g) => g._id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const sendWhatsApp = async (g: Guest) => {
    const tmpl = (typeof window !== 'undefined' && window.localStorage.getItem(`wa-template-${client._id}`)) || DEFAULT_WA_TEMPLATE;
    const msg = buildWaMessage(tmpl, {
      invitationName: g.invitationName,
      couple: `${client.groomName} & ${client.brideName}`,
      link: invitationUrl(client.slug, g.slug),
    });
    window.open(waLink(g.phone, msg), '_blank');
    try {
      const { data } = await api.patch(`/guests/${g._id}/invited`, { invited: true });
      replaceGuest(data.guest);
    } catch { /* ignore */ }
  };

  const toggleInvited = async (g: Guest) => {
    try {
      const { data } = await api.patch(`/guests/${g._id}/invited`, { invited: !g.invitedAt });
      replaceGuest(data.guest);
    } catch { setError('Failed to update invited status'); }
  };

  const copyLink = (g: Guest) => {
    navigator.clipboard.writeText(invitationUrl(client.slug, g.slug));
    setSuccess('Link copied');
    setTimeout(() => setSuccess(''), 1500);
  };

  const selectedGuests = guests.filter((g) => selectedIds.has(g._id));
```

- [ ] **Step 4: Replace the toolbar buttons**

Replace the toolbar block:

```tsx
          <Button variant="outline" size="sm" onClick={() => { setShowCsvUpload(!showCsvUpload); setShowBulkAdd(false); setShowAddGuest(false); }}>
            {showCsvUpload ? 'Cancel CSV' : 'Upload CSV'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowBulkAdd(!showBulkAdd); setShowCsvUpload(false); setShowAddGuest(false); }}>
            {showBulkAdd ? 'Cancel Bulk' : '+ Bulk Add'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowAddGuest(!showAddGuest); setShowBulkAdd(false); setShowCsvUpload(false); }}>
            {showAddGuest ? 'Cancel' : '+ Add Guest'}
          </Button>
```

with:

```tsx
          {selectedIds.size > 0 && (
            <Button size="sm" onClick={() => setShowQueue(true)}>
              Send WhatsApp ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>Import</Button>
          <Button variant="outline" size="sm" onClick={() => { setShowBulkAdd(!showBulkAdd); setShowAddGuest(false); }}>
            {showBulkAdd ? 'Cancel Bulk' : '+ Bulk Add'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowAddGuest(!showAddGuest); setShowBulkAdd(false); }}>
            {showAddGuest ? 'Cancel' : '+ Add Guest'}
          </Button>
```

- [ ] **Step 5: Remove the inline CSV-upload JSX block**

Delete the entire `{showCsvUpload && ( … )}` block (the `<div className="p-4 bg-muted/40 …">` containing the file input + preview table).

- [ ] **Step 6: Add checkbox column + actions to the table**

Replace the table header row:

```tsx
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>RSVP</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
```

with:

```tsx
                  <TableRow>
                    <TableHead className="w-8">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary align-middle"
                        checked={paginatedGuests.length > 0 && paginatedGuests.every((g) => selectedIds.has(g._id))}
                        onChange={toggleSelectPage}
                        aria-label="Select page"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>RSVP</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
```

Replace the table body row:

```tsx
                    <TableRow key={g._id}>
                      <TableCell>
                        <p className="font-medium text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.invitationName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{categoryLabel(g.category)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{g.slug}</TableCell>
                      <TableCell>
                        <Badge variant={rsvpVariant(g.rsvpStatus)}>{g.rsvpStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{g.numberOfGuests}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete guest?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {g.name} and all their RSVP data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteGuest(g._id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
```

with:

```tsx
                    <TableRow key={g._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary align-middle"
                          checked={selectedIds.has(g._id)}
                          onChange={() => toggleSelect(g._id)}
                          aria-label={`Select ${g.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-sm">{g.name}</p>
                            <p className="text-xs text-muted-foreground">{g.invitationName}</p>
                          </div>
                          {g.invitedAt && (
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-green-600 border-green-600/40"
                              title={`Invited ${new Date(g.invitedAt).toLocaleString('id-ID')} — click to clear`}
                              onClick={() => toggleInvited(g)}
                            >
                              Invited ✓
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{categoryLabel(g.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rsvpVariant(g.rsvpStatus)}>{g.rsvpStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!normalizePhone(g.phone)}
                            onClick={() => sendWhatsApp(g)}
                          >
                            WhatsApp
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyLink(g)}>Copy link</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete guest?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {g.name} and all their RSVP data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteGuest(g._id)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
```

- [ ] **Step 7: Render the two dialogs**

Just before the final closing `</CardContent>` tag, add:

```tsx
        <ImportGuestsDialog
          open={showImport}
          onOpenChange={setShowImport}
          clientId={client._id}
          onImported={(gs) => setGuests((prev) => [...gs, ...prev])}
          setError={setError}
          setSuccess={setSuccess}
        />
        <SendWhatsAppQueue
          open={showQueue}
          onOpenChange={setShowQueue}
          client={client}
          guests={selectedGuests}
          onGuestUpdated={replaceGuest}
        />
```

- [ ] **Step 8: Type-check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no type errors. If `BulkGuestRow` import is now unused in `GuestsTab.tsx`, remove it from the type import.

- [ ] **Step 9: Commit**

```bash
git add "apps/web/src/app/(dashboard)/clients/[id]/tabs/GuestsTab.tsx"
git commit -m "feat(guests): WhatsApp send + smart import wired into GuestsTab"
```

---

## Task 6: Admin env var

**Files:** `apps/web/.env.example`

- [ ] **Step 1: Document the base URL**

Append to `apps/web/.env.example` (create the file if missing):

```
# Public base URL of the invitation app, used to build guest WhatsApp links.
# Local dev: http://localhost:3001 ; production: the deployed invitation URL.
NEXT_PUBLIC_INVITATION_BASE_URL=http://localhost:3001
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/.env.example
git commit -m "docs(web): document NEXT_PUBLIC_INVITATION_BASE_URL"
```

---

## Task 7: End-to-end verification

**Files:** none (operational).

- [ ] **Step 1: Type-check both workspaces + lint**

Run: `cd server && npx tsc --noEmit` → no errors.
Run: `cd apps/web && npx tsc --noEmit` → no errors.
Run (repo root): `npm run lint` → tasks succeed.

- [ ] **Step 2: Verify the endpoint with an authenticated probe**

Run this from repo root (logs in as the seeded admin, marks a dega-ditta guest invited, confirms it persists):

```bash
node -e '
const BASE="http://localhost:5000/api";
(async()=>{
  const login = await (await fetch(BASE+"/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"admin@wedding.dev",password:"password123"})})).json();
  const token = login.token; console.log("token:", token ? "ok" : JSON.stringify(login));
  const inv = await (await fetch(BASE+"/invitations/dega-ditta")).json();
  const clientId = inv.invitation._id;
  const gs = await (await fetch(BASE+"/guests/client/"+clientId,{headers:{Authorization:"Bearer "+token}})).json();
  const g = gs.guests[0]; console.log("guest:", g.name, "invitedAt before:", g.invitedAt);
  const r = await (await fetch(BASE+"/guests/"+g._id+"/invited",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({invited:true})})).json();
  console.log("after PATCH invited:true ->", r.guest && r.guest.invitedAt);
  const r2 = await (await fetch(BASE+"/guests/"+g._id+"/invited",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({invited:false})})).json();
  console.log("after PATCH invited:false ->", r2.guest && r2.guest.invitedAt);
})();
'
```
Expected: a token, an `invitedAt` ISO timestamp after `invited:true`, and `null` after `invited:false`.
(If the login route differs, check `server/src/routes/index.ts` for the auth mount path and adjust.)

- [ ] **Step 3: Playwright check on the admin (`:3000`)**

Open the dega-ditta client's **Guests** tab. Confirm:
- A guest row's **WhatsApp** button opens `https://wa.me/62…?text=…` whose decoded text contains `…/dega-ditta?to=<slug>`; it's disabled when the guest has no phone.
- **Copy link** copies the invitation URL.
- Select 2–3 guests → **Send WhatsApp (N)** → queue opens; editing the message and reopening keeps the edit (localStorage); **Open** marks a guest and an **Invited ✓** badge appears on the row; reloading the page keeps the badge.
- **Import** → **Download template** downloads `guest-template.csv`; uploading a Google-contacts-style CSV auto-detects columns, lets you remap, previews normalized rows, and imports.

- [ ] **Step 4: Final commit (only if Step 3 required tweaks)**

```bash
git add -A
git commit -m "fix(guests): tune WhatsApp/import UI after verification"
```

---

## Notes for the executor

- `@wedding/shared` has no `Guest` type — only `GuestCategory`. So invited status touches `server/src/models/Guest.ts` + the admin's local `types.ts` only.
- The two new dialogs live under `tabs/guests/`; from there, shared utils are `../../helpers` / `../../types` / `../../constants`.
- The bulk import endpoint (`POST /guests/bulk/:clientId`) is unchanged — `ImportGuestsDialog` produces the same `BulkGuestRow[]` payload the existing flow used.
- Selection uses a native `<input type="checkbox">` — this project has no shadcn `Checkbox` primitive and we deliberately avoid adding the `@radix-ui/react-checkbox` dependency.
- WhatsApp links only resolve for real once the invitation app is deployed (or via a public tunnel); `normalizePhone`/`waLink`/`buildWaMessage` are fully testable now regardless.
