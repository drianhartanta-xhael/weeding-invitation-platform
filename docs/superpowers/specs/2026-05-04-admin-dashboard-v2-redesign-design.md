# Admin Dashboard V2 Redesign (Dark Navy)

**Date:** 2026-05-04
**Scope:** Full visual redesign of `apps/web` (admin dashboard) per the V2 "Dark Navy" variant from the Claude Design handoff bundle (`Wedding Admin Dashboard.html`).
**Source bundle:** `.design-cache/` (extracted from the design URL the user provided).
**Target:** `apps/web` only. `apps/invitation` is unchanged; `server` and `packages/shared` get small additive changes (new `venue` field on `Client`; populate template color in `/clients` listing). See Section 8.

---

## 1. Goals

- Apply the V2 Dark Navy visual language across every page of `apps/web`: dark navy sidebar, white content surfaces, amber `#f59e0b` accent, Inter typography.
- Re-skin via shadcn CSS tokens (`globals.css`) so existing primitives (`Sidebar`, `Card`, `Table`, `Tabs`, etc.) inherit the new look.
- Replace the current `Heart` brand icon with a custom inline SVG monogram logo.
- Switch UI strings to Indonesian to match the design source and the rest of the platform.
- Build small bespoke components for the design-specific bits (`StatCard`, `StatusToggle`, `Logo`, `AuthCard`, page-header context).
- Keep `apps/invitation` and the server API contract stable except for two additive changes: a `venue` field on `Client` and a count-augmented `/clients` listing.

## 2. Non-goals

- No full dark mode (the design is "dark sidebar, light content", not full dark).
- No structural rewrite of shadcn primitives — just re-skin via tokens + small additive components.
- No new analytics integration; "Total Views" stat shows "—".
- No new "Tamu" or "Analitik" routes — sidebar entries render as disabled "Soon" items.
- No theme switcher in the admin (V2 only). V1/V3 from the design bundle are not implemented.
- No translation framework (i18n library). Strings are written directly in Indonesian in JSX.

## 3. Key user-visible decisions

| ID | Decision | Choice |
|---|---|---|
| Variant | Which of V1/V2/V3 to implement | **V2 Dark Navy** |
| Scope | Pages to redesign | **All dashboard + auth pages** (full sweep) |
| Brand | Name + mark | Keep "WeddingApp" name, **new custom SVG logo** replaces Heart icon |
| Auth | Register page parity with login | **Yes**, register mirrors login card |
| Toggle | Status control on clients list | **Replace status badge with on/off pill toggle** ("Aktif"/"Nonaktif") |
| Locale | UI string language | **Indonesian** |
| D1 | Client venue field | **Add `venue` field to Client model**, show as secondary line under couple name |
| D2 | RSVP counts in clients list | **Skip the progress bar; show "—"** |
| D3 | Row actions on clients list | **Whole row clickable → detail; kebab menu with only "Hapus"** |
| D4 | "Tamu" + "Analitik" sidebar entries | **Disabled "Soon" items** (no dead routes) |

## 4. Approach

**Approach 1 — re-skin via CSS tokens, keep shadcn primitives.** The design is a visual spec, not structural (per the bundle's README). Updating `globals.css` HSL tokens lets every shadcn component inherit V2 colors without invasive rewrites. Bespoke additive components (`StatCard`, `StatusToggle`, `Logo`, `AuthCard`) cover the design-specific bits not in shadcn's vocabulary. Accessibility (focus rings, mobile sheet, keyboard nav) is preserved.

## 5. Design tokens (`apps/web/src/app/globals.css`)

The `:root` block is replaced with the V2 palette (HSL values for shadcn compatibility; raw hex shown here for clarity). No `.dark` variant is added.

| Token | Hex | Used for |
|---|---|---|
| `--background` | `#f0f2f5` | Page bg outside cards |
| `--foreground` | `#0f1629` | Body text |
| `--card` | `#ffffff` | Card / table / topbar surface |
| `--card-foreground` | `#0f1629` | Text on cards |
| `--primary` | `#f59e0b` | Buttons, active states |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#f3f4f6` | Subtle bg (chips, search) |
| `--muted` | `#f9fafb` | Table head bg, hover surfaces |
| `--muted-foreground` | `#6b7280` | Subtitles, placeholders |
| `--border` | `#e5e7eb` | Hairlines |
| `--ring` | `#f59e0b` | Focus rings |
| `--destructive` | `#dc2626` | Delete actions |
| `--sidebar-background` | `#0f1629` | Sidebar surface |
| `--sidebar-foreground` | `rgba(255,255,255,0.45)` | Idle nav text |
| `--sidebar-active-bg` | `rgba(245,158,11,0.12)` | Active nav row bg |
| `--sidebar-hover-bg` | `rgba(255,255,255,0.06)` | Hover nav row bg |
| `--sidebar-border` | `rgba(255,255,255,0.06)` | Sidebar dividers |
| `--sidebar-width` | `13.5rem` (216px) | Sidebar expanded width |
| `--accent-success` | `#10b981` | Active dot, success accent |
| `--accent-info` | `#3b82f6` | Stat card accent variant |
| `--accent-violet` | `#6366f1` | Stat card accent variant |
| `--accent-amber` | `#f59e0b` | Stat card accent variant |
| `--radius` | `0.5rem` (8px) | Card / control corner radius |

**Typography:** Inter (already loaded in `apps/web/src/app/layout.tsx`). Base font-size remains Tailwind default 14px; the design's compact 13px feel is achieved via Tailwind utilities (`text-xs`, `text-sm`) on individual elements.

## 6. New / changed components

### 6.1 `<Logo />` — `apps/web/src/components/Logo.tsx`

A custom SVG monogram. Replaces all uses of the `Heart` lucide icon as the brand mark.

- **Mark:** Italic serif "W" stroke (white) inside a rounded square (8px radius) with linear gradient `#f59e0b → #d97706` at 135°.
- **API:** `<Logo size={32} />`. Default size 32. The component uses `useId()` to scope its gradient `<defs>` so multiple instances on one page don't collide.
- **Usage:** sidebar logo (size 32), login/register card (size 40).

### 6.2 `<StatCard />` — `apps/web/src/components/admin/StatCard.tsx`

Replaces the existing dashboard stat card markup.

- **Props:** `{ accentColor: string; label: string; value: ReactNode; sub?: string; loading?: boolean }`.
- **Layout:** white bg, 1px `--border`, 10px radius, 16×18px padding, `position: relative`. Left edge = 3px-wide vertical accent bar (full height) colored from `accentColor`.
- **Type:** label 10px uppercase 0.04em semibold muted; value 26px bold tight-tracking; sub 11px muted.
- Loading state shows `Skeleton` in the value slot.

### 6.3 `<StatusToggle />` — `apps/web/src/components/admin/StatusToggle.tsx`

Replaces the clickable Status badge on the clients list.

- **Props:** `{ checked: boolean; onChange: (next: boolean) => void; loading?: boolean; disabled?: boolean }`.
- **Layout:** 34×19px pill button. Background = `--primary` when on, `#d1d5db` when off. Inner 14×14px white circle slides left/right (CSS transition).
- Adjacent siblings rendered by the consumer: 7px colored status dot (emerald when on, gray when off) + label "Aktif"/"Nonaktif" (11px semibold, 60% opacity).
- Internal `e.stopPropagation()` so toggling inside a clickable row doesn't trigger row navigation.

### 6.4 `<AuthCard />` — `apps/web/src/app/(auth)/_components/AuthCard.tsx`

Shared chrome for login + register pages.

- **Props:** `{ title: string; subtitle: string; children: ReactNode; footer?: ReactNode }`.
- **Layout:** centered 480px white card, 14px radius, deep shadow `0 40px 100px rgba(0,0,0,0.55)`, 48px padding. Logo block (size-40 `<Logo />` + brand stack) at top, then heading, then subtitle, then `children` (the form), then `footer` slot for hint text.

### 6.5 `usePageHeader` context — `apps/web/src/components/admin/PageHeaderProvider.tsx`

Lets each page inject its title, subtitle, and primary action into the topbar.

- **Provider:** wraps the dashboard layout's `<main>`. Stores `{ title, subtitle, action }` in state where `action` is `{ label: string; icon?: LucideIcon } & ({ href: string } | { onClick: () => void })`.
- **Hook:** `usePageHeader({ title, subtitle?, action? })` — runs in a `useEffect` on each page; sets state on mount, clears on unmount.
- Topbar reads from context. If a page doesn't call the hook, topbar shows `title="Dashboard"` and no action (fallback).

### 6.6 Sidebar (in `apps/web/src/app/(dashboard)/layout.tsx`)

Rebuilt inside the existing shadcn `Sidebar` shell.

- **Logo block** (`<SidebarHeader>`): `<Logo size={32} />` + brand stack ("WeddingApp" 13px bold; "Admin Portal" 9px uppercase 0.07em letter-spacing white/40). Border-bottom.
- **Nav body** (`<SidebarContent>`): two labeled groups via `<SidebarGroupLabel>`:
  - **Menu**: Dashboard, Undangan (+ chip badge `client count`), Tamu (disabled+tooltip "Segera hadir"), Analitik (disabled+tooltip).
  - **Konfigurasi**: Tema, Pengaturan.
  - Item style: 8×10px padding, 7px radius, 15px lucide icon + 13px medium label. Idle white/45; hover `--sidebar-hover-bg`; active amber bg + amber text.
  - Chip badge: amber pill `rgba(245,158,11,0.2)` bg, `#f59e0b` text, 10px font, ml-auto.
- **Lucide icons:** Dashboard `LayoutDashboard`; Undangan `Mail`; Tamu `Users`; Analitik `BarChart3`; Tema `Palette`; Pengaturan `Settings`; logout `LogOut`.
- **Footer** (`<SidebarFooter>`): 30px amber-gradient avatar circle (initial) + name "Admin" (12px medium) + email (10px white/30) + ghost icon-only `LogOut` button on the right. Border-top.

### 6.7 Topbar (in `apps/web/src/app/(dashboard)/layout.tsx`)

Replaces current 12px-tall header. New: 56px tall, white bg (`--card`), border-b, px-6.

- **Left:** stacked title (16px bold, tight tracking) + subtitle (11px muted), read from `usePageHeader` context.
- **Right:** Search field (210px wide, gray-100 bg, search icon prefix, "Cari..." placeholder; static for now — wired to a no-op `onChange` until per-page search is added) + primary action button (renders only if `action` is set on context). Mobile (`< sm`): search collapses to icon button only.

## 7. Page-by-page changes

### 7.1 Auth pages

**`apps/web/src/app/(auth)/layout.tsx`** (new):
- Sets body bg `#0e0e10`, centers content vertically, full viewport height.

**`apps/web/src/app/(auth)/login/page.tsx`** (rewrite markup, keep auth logic):
- Wrap in `<AuthCard title="Selamat datang 👋" subtitle="Masuk untuk mengelola undangan pernikahan">`.
- Form: email + password (uppercase semibold 11px labels, 1.5px gray-200 borders 8px radius, focus = amber).
- Submit button: full width, amber, 8px radius, label "Masuk ke Dashboard →".
- Footer hint: "Lupa kata sandi? Reset di sini" (link in amber).
- Existing auth flow (POST `/auth/login`, store JWT, redirect to `/dashboard`) unchanged.
- Error states still use shadcn `Alert`.

**`apps/web/src/app/(auth)/register/page.tsx`** (rewrite markup, keep auth logic):
- Same `<AuthCard>` with title "Buat akun baru ✨", subtitle "Daftar untuk mulai membuat undangan".
- Adds `name` field above email.
- Submit: "Buat Akun →".
- Footer hint: "Sudah punya akun? Masuk di sini".

### 7.2 Dashboard overview (`apps/web/src/app/(dashboard)/dashboard/page.tsx`)

- Calls `usePageHeader({ title: "Dashboard", subtitle: "Ringkasan platform undangan kamu" })`.
- Replaces existing 4 cards with `<StatCard>` instances:
  - Total Klien (accent indigo `#6366f1`)
  - Total Tamu (accent emerald `#10b981`)
  - Total Ucapan (accent amber `#f59e0b`)
  - Total Hadiah (accent blue `#3b82f6`)
- Data source unchanged: `GET /clients/stats/overview`.

### 7.3 Clients list (`apps/web/src/app/(dashboard)/clients/page.tsx`) — **the headline page**

- `usePageHeader({ title: "Daftar Undangan", subtitle: \`\${total} undangan · \${activeCount} aktif\`, action: { label: "Buat Undangan", icon: Plus, href: "/clients/new" } })`.
- **Stats row (4 cards above table):**
  - Total Undangan (indigo) — value: `total`, sub: `+{n} bulan ini` (clients with `createdAt` in current month).
  - Total RSVP (emerald) — value/sub: from `/clients/stats/overview` if present, else "—".
  - Total Views (amber) — "—" (no analytics yet).
  - Aktif (blue) — value: count of `status === 'published'`, sub: `{n} nonaktif`.
- **Table panel:**
  - White panel, 1px border, 10px radius.
  - Header bar (14×18 padding, border-b): "Semua Undangan" (14px bold) + count badge; right side = 3 filter pills "Semua" / "Aktif" / "Nonaktif" (amber-tinted active state). Filter applies client-side.
  - Head row: grid `2fr 1fr 1.2fr 90px 80px 40px`, `--muted` bg, columns "Pasangan & Venue" / "Tema" / "Tanggal" / "RSVP" / "Aktif" / (empty for kebab).
  - Rows: same grid, hover `--muted`, `cursor: pointer`, `onClick` → `router.push(\`/clients/\${id}\`)`.
    - **Cell 1:** "Groom & Bride" (13px semibold) + `venue` (11px muted) below. Falls back to slug if venue absent.
    - **Cell 2:** Theme chip — pill with colored dot + theme name, color from `client.templateId.primaryColor` (populated by server) or neutral gray.
    - **Cell 3:** `eventDate` formatted "13 Jun 2026" (id-ID).
    - **Cell 4:** "—" (RSVP progress bar dropped per D2).
    - **Cell 5:** `<StatusToggle>` + dot + "Aktif"/"Nonaktif" label. Toggle handler maps to PUT `/clients/:id` with `status: 'published'|'draft'`.
    - **Cell 6:** `DropdownMenu` (shadcn) trigger = `MoreVertical` icon button (ghost). Menu: only "Hapus" → opens existing `AlertDialog`. `e.stopPropagation()` on trigger and menu items.
  - Empty state: white panel, "Belum ada undangan." + outline button "Buat undangan pertama".

### 7.4 New Client (`apps/web/src/app/(dashboard)/clients/new/page.tsx`)

- `usePageHeader({ title: "Buat Undangan Baru", subtitle: "Isi data pasangan & acara", action: { label: "Simpan", onClick: <form submit handler> } })`.
- Form wrapped in white panel chrome (10px radius, 14×18 header bar, border).
- **Adds `venue` field** (text input, label "Lokasi Acara", required).
- Secondary "Batal" link in form footer → `/clients`.

### 7.5 Client detail (`apps/web/src/app/(dashboard)/clients/[id]/page.tsx`)

- `usePageHeader({ title: \`\${groomName} & \${brideName}\`, subtitle: \`\${formattedDate} · \${venue}\`, action: { label: "Lihat Undangan", icon: ExternalLink, href: <public invitation URL>, target: "_blank" } })`. Topbar action API extends to support `target`.
- Above tabs: row of summary chips — Status pill, Theme pill (with colored dot), Date pill.
- Tabs: restyle trigger row to filter-tab style (amber active, transparent idle).
- Each tab content panel: white bg, 10px radius, 18px padding.
- All existing tab implementations (Couple, Events, Details, Sections, Guests, Wishes, Gifts, Activity, Overview) keep their logic; only panel chrome + input styling change via global tokens.

### 7.6 Templates list (`apps/web/src/app/(dashboard)/templates/page.tsx`)

- `usePageHeader({ title: "Tema", subtitle: \`\${n} tema tersedia\` })` — no action button (no `/templates/new` route currently exists in the codebase; templates are seeded server-side).
- Wrap grid-of-cards layout in white panel chrome with header bar "Semua Tema" + count badge.
- Each card: white bg, 1px border, 10px radius, hover lift; small color preview swatch row at top reflecting `primaryColor` / `accentColor`.

### 7.7 Template edit (`apps/web/src/app/(dashboard)/templates/[id]/page.tsx`)

- `usePageHeader({ title: <template name>, subtitle: "Edit tema", action: { label: "Simpan", onClick: <save handler> } })`.
- Form sections wrapped in white panels (header bar + body), matching client detail panels.
- Color pickers, font selectors keep functionality; only restyled.

### 7.8 Settings (`apps/web/src/app/(dashboard)/settings/page.tsx`)

- `usePageHeader({ title: "Pengaturan", subtitle: "Akun & preferensi", action: <"Simpan" if savable form, else omit> })`.
- Settings sections wrapped in white panels.

## 8. Server-side changes (additive, minimal)

### 8.1 `Client` model — add `venue` field

- **`server/src/models/Client.ts`:** add `venue: { type: String, trim: true }` (optional — existing clients don't have it).
- **`server/src/controllers/clientController.ts`:** include `venue` in create/update Zod schemas as `z.string().trim().min(1).optional()`.
- **`packages/shared/src/types/client.ts`**: add `venue?: string` to the `Client` interface.

### 8.2 `/clients` listing — populate template color

- **`server/src/controllers/clientController.ts` (list endpoint):** add `.populate('templateId', 'name primaryColor accentColor')` so the clients list can render the theme chip without a second request.
- No change to response shape beyond `templateId` becoming a populated object instead of an ObjectId string.

### 8.3 No new endpoints

- The "Total Views" stat stays as "—" — no analytics endpoint is added.
- "RSVP" cell is "—" per D2 — no per-client aggregation needed.
- Existing `GET /clients/stats/overview` is reused for dashboard stats.

## 9. Files to touch (inventory)

**New files:**
- `apps/web/src/components/Logo.tsx`
- `apps/web/src/components/admin/StatCard.tsx`
- `apps/web/src/components/admin/StatusToggle.tsx`
- `apps/web/src/components/admin/PageHeaderProvider.tsx`
- `apps/web/src/app/(auth)/_components/AuthCard.tsx`
- `apps/web/src/app/(auth)/layout.tsx`

**Modified files:**
- `apps/web/src/app/globals.css` — replace token block.
- `apps/web/src/app/(dashboard)/layout.tsx` — sidebar rebuild + topbar replacement + wrap `main` in `<PageHeaderProvider>`.
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — use `<StatCard>` + page-header hook.
- `apps/web/src/app/(dashboard)/clients/page.tsx` — full rewrite of UI (data fetch logic preserved).
- `apps/web/src/app/(dashboard)/clients/new/page.tsx` — add venue field, page-header hook, panel chrome.
- `apps/web/src/app/(dashboard)/clients/[id]/page.tsx` — page-header hook, summary chips, panel chrome on tabs.
- `apps/web/src/app/(dashboard)/templates/page.tsx` — page-header hook, panel chrome, restyle cards.
- `apps/web/src/app/(dashboard)/templates/[id]/page.tsx` — page-header hook, panel chrome.
- `apps/web/src/app/(dashboard)/settings/page.tsx` — page-header hook, panel chrome.
- `apps/web/src/app/(auth)/login/page.tsx` — rewrite markup using `<AuthCard>`.
- `apps/web/src/app/(auth)/register/page.tsx` — rewrite markup using `<AuthCard>`.
- `server/src/models/Client.ts` — add `venue` field.
- `server/src/controllers/clientController.ts` — Zod schema + populate template color.
- `packages/shared/src/types/client.ts` (or equivalent) — add `venue?: string`.

## 10. Out of scope

- Mobile responsive refinements beyond what shadcn already provides (sidebar sheet on small screens).
- Real "Tamu" or "Analitik" pages.
- Search functionality (the topbar search renders, but is a static field for now).
- Keyboard shortcuts (cmd+k, etc.).
- Dark mode for content area.
- Migration script to backfill `venue` for existing clients (optional and reversible — can be added later).
