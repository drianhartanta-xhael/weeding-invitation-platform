# Admin Dashboard V2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin `apps/web` to the V2 Dark Navy variant from the Claude Design handoff bundle: dark navy sidebar, white content surfaces, amber `#f59e0b` accent, Inter typography, Indonesian copy, custom SVG monogram logo replacing the Heart icon, with a page-aware topbar and small bespoke components for stat cards, status toggle, and the auth shell.

**Architecture:** Approach 1 from the spec — re-skin via shadcn CSS tokens (`globals.css`) so existing primitives inherit V2 colors, plus a small set of additive bespoke components (`Logo`, `StatCard`, `StatusToggle`, `AuthCard`, `PageHeaderProvider` context) for the design-specific bits. Server changes are minimal: add `venue` field to `Client` model + Zod + shared types, and populate `templateId` (with config colors) in `/clients` listing.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, shadcn/ui (with OKLCH tokens), lucide-react, Express + Mongoose + Zod (server), `@wedding/shared` (types).

**Important repo notes (read before starting any task):**
- `apps/web/src/app/globals.css` uses **OKLCH** color space (Tailwind v4 / shadcn convention) and the sidebar token is **`--sidebar`** (NOT `--sidebar-background`). The plan converts all V2 hex values to OKLCH inline.
- The shadcn `SidebarProvider` (`apps/web/src/components/ui/sidebar.tsx`) sets `--sidebar-width: 16rem` via inline style on its wrapper. To override to `13.5rem` (216px from the design), pass `style={{ '--sidebar-width': '13.5rem' }}` on `<SidebarProvider>`.
- The shadcn sidebar `data-active` styling uses `data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground` — set `--sidebar-accent` and `--sidebar-accent-foreground` to the amber-tinted active values.
- The repo has **no test framework**. Verification steps use `npm run lint` (TypeScript type-check) + manual browser check via `npm run dev:web` + screenshot description.
- Project has **no migrations** — adding the `venue` field is non-breaking (optional field, existing docs return `undefined`).
- `apps/web/src/app/(dashboard)/clients/new/page.tsx` is a **4-step wizard**, not a simple form. The venue field goes into Step 1 (Basic Info).
- The `Template` model stores colors under `config.primaryColor` (NOT a top-level `primaryColor` field). The populate field is `name slug config`.
- Dates: today is **2026-05-04**.

---

## File structure

**New files (created by this plan):**
- `apps/web/src/components/Logo.tsx` — SVG monogram component
- `apps/web/src/components/admin/StatCard.tsx` — stat card with vertical accent bar
- `apps/web/src/components/admin/StatusToggle.tsx` — pill toggle button
- `apps/web/src/components/admin/PageHeaderProvider.tsx` — context + hook for page-aware topbar
- `apps/web/src/app/(auth)/_components/AuthCard.tsx` — shared auth card chrome
- `apps/web/src/app/(auth)/layout.tsx` — auth route group layout (dark bg, centering)

**Modified files:**
- `apps/web/src/app/globals.css` — replace token block with V2 OKLCH palette
- `apps/web/src/app/(dashboard)/layout.tsx` — sidebar rebuild + topbar replacement + wrap main in PageHeaderProvider
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — use StatCard + page-header hook + Indonesian copy
- `apps/web/src/app/(dashboard)/clients/page.tsx` — full UI rewrite (data fetch logic preserved)
- `apps/web/src/app/(dashboard)/clients/new/page.tsx` — page-header hook, add Lokasi Acara field to Step 1, Indonesian copy, integrate venue into payload
- `apps/web/src/app/(dashboard)/clients/[id]/page.tsx` — page-header hook, summary chips, panel chrome on tabs
- `apps/web/src/app/(dashboard)/templates/page.tsx` — page-header hook, panel chrome
- `apps/web/src/app/(dashboard)/templates/[id]/page.tsx` — page-header hook, panel chrome
- `apps/web/src/app/(dashboard)/settings/page.tsx` — page-header hook, panel chrome
- `apps/web/src/app/(auth)/login/page.tsx` — rewrite using AuthCard + Indonesian
- `apps/web/src/app/(auth)/register/page.tsx` — rewrite using AuthCard + Indonesian
- `server/src/models/Client.ts` — add `venue: string` field
- `server/src/validators/client.ts` — add `venue` to Zod schema
- `server/src/controllers/clientController.ts` — `.populate('templateId', 'name slug config')` in `getClients`
- `packages/shared/src/types/client.ts` — add `venue?: string` to `IClient`

---

## Task 1: Update design tokens in globals.css

**Files:**
- Modify: `apps/web/src/app/globals.css`

**Why:** Apply the V2 Dark Navy palette via shadcn token overrides so every existing primitive (Card, Button, Input, Sidebar, Tabs, etc.) automatically inherits the new look. OKLCH values are computed equivalents of the V2 hex colors from the design.

- [ ] **Step 1: Replace the `:root` token block**

Open `apps/web/src/app/globals.css`. Replace the entire `:root { ... }` block (currently lines 6–40) with the V2 token set below. Leave the `.dark { ... }` block alone (we keep dark mode tokens for compatibility but the admin doesn't ship a dark mode toggle). Leave the trailing `* { border-color: ... }` and `body { ... }` blocks alone.

```css
  :root {
    /* V2 Dark Navy palette */
    --background: oklch(0.972 0.003 286);          /* #f0f2f5 page bg */
    --foreground: oklch(0.179 0.034 264);          /* #0f1629 body text */
    --card: oklch(1 0 0);                          /* #ffffff card surface */
    --card-foreground: oklch(0.179 0.034 264);     /* #0f1629 */
    --popover: oklch(1 0 0);                       /* #ffffff */
    --popover-foreground: oklch(0.179 0.034 264);  /* #0f1629 */
    --primary: oklch(0.762 0.165 70);              /* #f59e0b amber */
    --primary-foreground: oklch(1 0 0);            /* #ffffff */
    --secondary: oklch(0.961 0.002 286);           /* #f3f4f6 */
    --secondary-foreground: oklch(0.179 0.034 264);
    --muted: oklch(0.978 0.001 286);               /* #f9fafb */
    --muted-foreground: oklch(0.529 0.012 286);    /* #6b7280 */
    --accent: oklch(0.961 0.002 286);              /* #f3f4f6 */
    --accent-foreground: oklch(0.179 0.034 264);
    --destructive: oklch(0.583 0.224 27);          /* #dc2626 */
    --destructive-foreground: oklch(1 0 0);
    --border: oklch(0.922 0.003 286);              /* #e5e7eb */
    --input: oklch(0.922 0.003 286);               /* #e5e7eb */
    --ring: oklch(0.762 0.165 70);                 /* amber for focus */
    --chart-1: oklch(0.762 0.165 70);              /* amber */
    --chart-2: oklch(0.696 0.142 162);             /* emerald #10b981 */
    --chart-3: oklch(0.621 0.184 259);             /* blue #3b82f6 */
    --chart-4: oklch(0.589 0.207 287);             /* indigo #6366f1 */
    --chart-5: oklch(0.583 0.224 27);              /* red */
    --radius: 0.5rem;

    /* Sidebar (dark navy) */
    --sidebar: oklch(0.179 0.034 264);             /* #0f1629 */
    --sidebar-foreground: oklch(1 0 0 / 45%);      /* white/45 idle nav text */
    --sidebar-primary: oklch(0.762 0.165 70);      /* amber */
    --sidebar-primary-foreground: oklch(1 0 0);
    --sidebar-accent: oklch(0.762 0.165 70 / 12%); /* amber/12 active row bg */
    --sidebar-accent-foreground: oklch(0.762 0.165 70); /* amber active text */
    --sidebar-border: oklch(1 0 0 / 6%);           /* white/6 dividers */
    --sidebar-ring: oklch(0.762 0.165 70);
  }
```

- [ ] **Step 2: Verify the file parses**

Run: `cd apps/web && npm run lint`
Expected: no errors related to `globals.css`. (Type-check passes.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(web): apply V2 Dark Navy design tokens"
```

---

## Task 2: Create the Logo component

**Files:**
- Create: `apps/web/src/components/Logo.tsx`

**Why:** Replaces the lucide `Heart` icon used as the brand mark. Custom SVG monogram in a rounded square with amber gradient. Reusable at any size, with collision-free gradient IDs.

- [ ] **Step 1: Write the file**

Create `apps/web/src/components/Logo.tsx`:

```tsx
'use client';

import { useId } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * WeddingApp brand monogram.
 * Italic serif "W" inside a rounded square with amber→darker-amber gradient.
 * Replaces the previous Heart icon.
 */
export function Logo({ size = 32, className }: LogoProps) {
  const gradId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WeddingApp logo"
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="9" fill={`url(#${gradId})`} />
      {/* Italic serif "W" stroke — two slanted V shapes joined */}
      <path
        d="M9 12 L14.5 28 L20 18 L25.5 28 L31 12"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="skewX(-10) translate(3.5,0)"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/Logo.tsx
git commit -m "feat(web): add Logo SVG monogram component"
```

---

## Task 3: Create the PageHeaderProvider context

**Files:**
- Create: `apps/web/src/components/admin/PageHeaderProvider.tsx`

**Why:** The V2 design has a page-aware topbar (each page sets its own title, subtitle, and primary action). Without a context, every page would have to render its own topbar duplicated. This context lets each page call a single hook to inject its header into the shared layout.

- [ ] **Step 1: Write the file**

Create `apps/web/src/components/admin/PageHeaderProvider.tsx`:

```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PageHeaderAction {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  target?: '_blank' | '_self';
  loading?: boolean;
  disabled?: boolean;
}

export interface PageHeaderState {
  title: string;
  subtitle?: string;
  action?: PageHeaderAction;
}

interface PageHeaderContextValue {
  header: PageHeaderState;
  setHeader: (next: PageHeaderState) => void;
  resetHeader: () => void;
}

const DEFAULT_HEADER: PageHeaderState = { title: 'Dashboard' };

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<PageHeaderState>(DEFAULT_HEADER);

  const setHeader = useCallback((next: PageHeaderState) => {
    setHeaderState(next);
  }, []);

  const resetHeader = useCallback(() => {
    setHeaderState(DEFAULT_HEADER);
  }, []);

  const value = useMemo<PageHeaderContextValue>(
    () => ({ header, setHeader, resetHeader }),
    [header, setHeader, resetHeader]
  );

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeaderContext(): PageHeaderContextValue {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error('usePageHeaderContext must be used within <PageHeaderProvider>');
  }
  return ctx;
}

/**
 * Page hook — call once per page (in a useEffect) to set the topbar contents.
 * Resets to the default ({ title: "Dashboard" }) on unmount.
 *
 * The `deps` array follows React useEffect rules — pass dependencies the header
 * derives from (e.g. dynamic title from a fetched object).
 */
export function usePageHeader(state: PageHeaderState, deps: unknown[] = []): void {
  const { setHeader, resetHeader } = usePageHeaderContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setHeader(state);
    return () => resetHeader();
  }, deps);
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/PageHeaderProvider.tsx
git commit -m "feat(web): add PageHeaderProvider context for page-aware topbar"
```

---

## Task 4: Create the StatCard component

**Files:**
- Create: `apps/web/src/components/admin/StatCard.tsx`

**Why:** The design's stat card has a 3px vertical accent bar on the left edge that the shadcn `Card` doesn't render. Bespoke component, used on `/dashboard` and `/clients`.

- [ ] **Step 1: Write the file**

Create `apps/web/src/components/admin/StatCard.tsx`:

```tsx
import { type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  /** Hex color for the 3px vertical accent bar on the left edge. */
  accentColor: string;
  label: string;
  value: ReactNode;
  sub?: string;
  loading?: boolean;
}

export function StatCard({ accentColor, label, value, sub, loading = false }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-border bg-card px-[18px] py-4">
      <span
        className="absolute left-0 top-0 h-full w-[3px] rounded-r-sm"
        style={{ backgroundColor: accentColor }}
        aria-hidden
      />
      <div className="pl-1.5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {label}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <div className="text-[26px] font-bold leading-none tracking-tight text-foreground">{value}</div>
        )}
        {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/StatCard.tsx
git commit -m "feat(web): add StatCard with vertical accent bar"
```

---

## Task 5: Create the StatusToggle component

**Files:**
- Create: `apps/web/src/components/admin/StatusToggle.tsx`

**Why:** Pill toggle button with sliding circle. Replaces the clickable status badge on the clients list. Internal `e.stopPropagation()` prevents triggering row navigation when toggling inside a clickable table row.

- [ ] **Step 1: Write the file**

Create `apps/web/src/components/admin/StatusToggle.tsx`:

```tsx
'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  /** Optional aria-label override; defaults to the Indonesian status name. */
  'aria-label'?: string;
}

export function StatusToggle({
  checked,
  onChange,
  loading = false,
  disabled = false,
  'aria-label': ariaLabel,
}: StatusToggleProps) {
  const label = ariaLabel ?? (checked ? 'Aktif' : 'Nonaktif');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || loading}
      onClick={(e) => {
        e.stopPropagation();
        if (!loading && !disabled) onChange(!checked);
      }}
      className={cn(
        'relative inline-flex h-[19px] w-[34px] shrink-0 items-center rounded-[10px] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-primary' : 'bg-[#d1d5db]'
      )}
    >
      <span
        className={cn(
          'absolute top-[2.5px] inline-block h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left]',
          checked ? 'left-[18px]' : 'left-[2.5px]'
        )}
        aria-hidden
      >
        {loading && <Loader2 className="h-[14px] w-[14px] animate-spin text-muted-foreground" />}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/StatusToggle.tsx
git commit -m "feat(web): add StatusToggle pill switch component"
```

---

## Task 6: Add `venue` field to Client model + Zod + shared types

**Files:**
- Modify: `server/src/models/Client.ts`
- Modify: `server/src/validators/client.ts`
- Modify: `packages/shared/src/types/client.ts`

**Why:** D1 from the spec — store a per-client wedding venue so the clients list can show "Couple / Venue" stacked, and the client detail topbar can display venue in the subtitle. Field is **optional** (existing docs return `undefined`), no migration needed.

- [ ] **Step 1: Modify Mongoose schema**

In `server/src/models/Client.ts`, add a `venue: string` line to the `IClientDocument` interface and a `venue` field to the schema definition.

In the interface (after `slug: string;` around line 27), add:

```ts
  venue: string;
```

In the schema (after the `slug` field block ending around line 118), insert:

```ts
    venue: {
      type: String,
      default: '',
      trim: true,
    },
```

- [ ] **Step 2: Modify Zod validator**

In `server/src/validators/client.ts`, add a `venue` field to `createClientSchema`. Insert after the `slug` line (around line 34):

```ts
  venue: z.string().optional(),
```

`updateClientSchema` is `createClientSchema.partial()` so it picks up the field automatically.

- [ ] **Step 3: Modify shared TypeScript type**

In `packages/shared/src/types/client.ts`, add `venue: string;` to the `IClient` interface. Insert after `slug: string;` (around line 54):

```ts
  venue: string;
```

- [ ] **Step 4: Verify server type-check passes**

Run: `cd server && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify web type-check passes**

Run: `cd apps/web && npm run lint`
Expected: no errors. (Existing usages of `IClient` won't break because TypeScript allows reading `client.venue` even if the runtime value is `undefined` for old docs — they'll just render an empty string. The clients list uses `client.venue || client.slug` as a fallback.)

- [ ] **Step 6: Commit**

```bash
git add server/src/models/Client.ts server/src/validators/client.ts packages/shared/src/types/client.ts
git commit -m "feat(server): add venue field to Client model"
```

---

## Task 7: Populate template config in /clients listing

**Files:**
- Modify: `server/src/controllers/clientController.ts:81`

**Why:** The clients list page needs the template's primary color to render the theme chip. Without populate, the response only contains `templateId` as a string. Adding `.populate()` returns it as `{ _id, name, slug, config: { primaryColor, ... } }`.

- [ ] **Step 1: Update `getClients`**

In `server/src/controllers/clientController.ts`, find the `getClients` function (around line 75–86). Replace the `Client.find` call with a populated version.

Old:
```ts
    const clients = await Client.find({ userId: req.user?._id }).sort({ createdAt: -1 });
```

New:
```ts
    const clients = await Client.find({ userId: req.user?._id })
      .populate('templateId', 'name slug config')
      .sort({ createdAt: -1 });
```

- [ ] **Step 2: Verify server type-check**

Run: `cd server && npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/clientController.ts
git commit -m "feat(server): populate template config in clients listing"
```

---

## Task 8: Rebuild dashboard layout (sidebar + topbar + provider)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

**Why:** This is the structural backbone of the redesign. The new layout (a) wraps `<main>` in `<PageHeaderProvider>` so any dashboard page can inject its topbar, (b) rebuilds the sidebar with two labeled sections, the new Logo, and the disabled "Soon" entries for Tamu / Analitik, and (c) replaces the 12px-tall header with a 56px topbar that reads from page-header context.

- [ ] **Step 1: Replace the entire layout file**

Overwrite `apps/web/src/app/(dashboard)/layout.tsx` with:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Mail,
  Users,
  BarChart3,
  Palette,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Logo } from '@/components/Logo';
import {
  PageHeaderProvider,
  usePageHeaderContext,
} from '@/components/admin/PageHeaderProvider';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  disabled?: boolean;
  tooltip?: string;
}

function AppSidebar({ undanganCount }: { undanganCount: number | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const menuItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Undangan', icon: Mail, badge: undanganCount ?? undefined },
    { href: '#', label: 'Tamu', icon: Users, disabled: true, tooltip: 'Segera hadir' },
    { href: '#', label: 'Analitik', icon: BarChart3, disabled: true, tooltip: 'Segera hadir' },
  ];
  const configItems: NavItem[] = [
    { href: '/templates', label: 'Tema', icon: Palette },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  const renderItem = (item: NavItem) => {
    const active =
      !item.disabled &&
      (pathname === item.href ||
        (item.href !== '/dashboard' && item.href !== '#' && pathname.startsWith(item.href)));

    const button = (
      <SidebarMenuButton
        asChild={!item.disabled}
        isActive={active}
        disabled={item.disabled}
        className={cn(
          'gap-2.5 px-2.5 text-[13px] font-medium',
          item.disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {item.disabled ? (
          <span className="flex w-full items-center gap-2.5">
            <item.icon className="h-[15px] w-[15px]" />
            <span>{item.label}</span>
          </span>
        ) : (
          <Link href={item.href}>
            <item.icon className="h-[15px] w-[15px]" />
            <span>{item.label}</span>
          </Link>
        )}
      </SidebarMenuButton>
    );

    return (
      <SidebarMenuItem key={`${item.label}-${item.href}`}>
        {item.tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right">{item.tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          button
        )}
        {item.badge !== undefined && (
          <SidebarMenuBadge className="bg-primary/20 text-primary">
            {item.badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-[18px] py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo size={32} />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold leading-tight text-white">WeddingApp</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-white/40">
              Admin Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2.5 py-1.5">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/25">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{menuItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/25">
            Konfigurasi
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{configItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-xs font-bold text-white">
            A
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-xs font-semibold text-white">Admin</span>
            <span className="truncate text-[10px] text-white/30">admin@wedding.dev</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            className="text-white/45 hover:bg-white/10 hover:text-white"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Topbar() {
  const { header } = usePageHeaderContext();
  const { title, subtitle, action } = header;
  const ActionIcon = action?.icon;

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-6">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold tracking-tight text-foreground">{title}</div>
        {subtitle && <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
      <div className="hidden items-center gap-2.5 sm:flex">
        <div className="flex h-9 w-[210px] items-center gap-2 rounded-[7px] border border-border bg-secondary px-3 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>Cari...</span>
        </div>
      </div>
      {action &&
        (action.href ? (
          <Button asChild size="sm" disabled={action.disabled} className="gap-1.5">
            <Link href={action.href} target={action.target}>
              {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className="gap-1.5"
          >
            {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
            {action.loading ? 'Menyimpan...' : action.label}
          </Button>
        ))}
    </header>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [undanganCount, setUndanganCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .get('/clients/stats/overview')
      .then(({ data }) => setUndanganCount(data.stats?.totalClients ?? 0))
      .catch(() => setUndanganCount(0));
  }, []);

  return (
    <SidebarProvider style={{ '--sidebar-width': '13.5rem' } as React.CSSProperties}>
      <AppSidebar undanganCount={undanganCount} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageHeaderProvider>
      <DashboardShell>{children}</DashboardShell>
    </PageHeaderProvider>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes. If you get an error about `icon-sm` not being a valid Button size, check `apps/web/src/components/ui/button.tsx` for the available sizes — substitute `icon` (default icon size) if `icon-sm` isn't defined.

- [ ] **Step 3: Manual verification**

Run: `npm run dev:web` from project root.
Open `http://localhost:3000/dashboard` (after logging in).
Expected: dark navy sidebar 216px wide, white topbar 56px, "Dashboard" title shown (default header from context — pages haven't been migrated yet so subtitle/action are absent). Sidebar has Logo + "WeddingApp / Admin Portal", Menu section with Dashboard / Undangan (with badge) / Tamu (disabled) / Analitik (disabled), Konfigurasi section with Tema / Pengaturan, footer with avatar + Admin + LogOut. Hover on disabled items shows "Segera hadir" tooltip.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(dashboard)/layout.tsx
git commit -m "feat(web): rebuild dashboard layout with V2 sidebar and page-aware topbar"
```

---

## Task 9: Create the AuthCard component and (auth) layout

**Files:**
- Create: `apps/web/src/app/(auth)/_components/AuthCard.tsx`
- Create: `apps/web/src/app/(auth)/layout.tsx`

**Why:** Both login and register share the same card chrome (logo block + heading + subtitle + body + footer). Extracting into one component keeps them in sync. The new `(auth)/layout.tsx` sets the dark page background and centers the card vertically — the dashboard layout doesn't apply to `(auth)` routes since they're in a separate route group.

- [ ] **Step 1: Create AuthCard**

Create `apps/web/src/app/(auth)/_components/AuthCard.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-[480px] max-w-[calc(100vw-2rem)] rounded-[14px] bg-card p-12 shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
      <div className="mb-9 flex items-center gap-3">
        <Logo size={40} />
        <div>
          <div className="text-lg font-bold text-foreground">WeddingApp</div>
          <div className="text-xs text-muted-foreground">Admin Portal</div>
        </div>
      </div>
      <h1 className="mb-1.5 text-[22px] font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mb-7 text-[13px] text-muted-foreground">{subtitle}</p>
      {children}
      {footer && <div className="mt-4 text-center text-[11px] text-muted-foreground">{footer}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create (auth) layout**

Create `apps/web/src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0e0e10] p-5">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(auth)/_components/AuthCard.tsx apps/web/src/app/(auth)/layout.tsx
git commit -m "feat(web): add AuthCard component and auth route group layout"
```

---

## Task 10: Restyle login page

**Files:**
- Modify: `apps/web/src/app/(auth)/login/page.tsx`

**Why:** Replace the existing English shadcn-Card layout with the new AuthCard + Indonesian copy. Auth flow (POST `/auth/login`, store JWT, redirect) is preserved exactly.

- [ ] **Step 1: Replace the file**

Overwrite `apps/web/src/app/(auth)/login/page.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthCard } from '../_components/AuthCard';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Selamat datang 👋"
      subtitle="Masuk untuk mengelola undangan pernikahan"
      footer={
        <>
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Daftar di sini
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="admin@wedding.dev"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground"
          >
            Kata Sandi
          </label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <Button type="submit" className="mt-2 h-11 w-full rounded-lg text-[13px] font-semibold" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk ke Dashboard →'}
        </Button>
      </form>
    </AuthCard>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 3: Manual verification**

`http://localhost:3000/login` should show the new dark-bg-centered card with logo, title "Selamat datang 👋", Indonesian form labels (EMAIL / KATA SANDI), amber submit button.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(auth)/login/page.tsx
git commit -m "feat(web): restyle login page with V2 AuthCard and Indonesian copy"
```

---

## Task 11: Restyle register page

**Files:**
- Modify: `apps/web/src/app/(auth)/register/page.tsx`

**Why:** Mirror the login restyle (same AuthCard chrome, same input style). Adds the Name field above Email.

- [ ] **Step 1: Replace the file**

Overwrite `apps/web/src/app/(auth)/register/page.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthCard } from '../_components/AuthCard';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Buat akun baru ✨"
      subtitle="Daftar untuk mulai membuat undangan"
      footer={
        <>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground">
            Nama
          </label>
          <Input
            type="text"
            placeholder="Nama lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground">
            Email
          </label>
          <Input
            type="email"
            placeholder="kamu@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground">
            Kata Sandi
          </label>
          <Input
            type="password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <Button type="submit" className="mt-2 h-11 w-full rounded-lg text-[13px] font-semibold" disabled={loading}>
          {loading ? 'Membuat akun...' : 'Buat Akun →'}
        </Button>
      </form>
    </AuthCard>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 3: Manual verification**

`http://localhost:3000/register` matches login styling, with Nama / Email / Kata Sandi fields and "Buat Akun →" button.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(auth)/register/page.tsx
git commit -m "feat(web): restyle register page to match V2 login"
```

---

## Task 12: Restyle dashboard overview page

**Files:**
- Modify: `apps/web/src/app/(dashboard)/dashboard/page.tsx`

**Why:** Use `<StatCard>` and `usePageHeader` so the topbar shows the page title and the stats use the new vertical-accent-bar style.

- [ ] **Step 1: Replace the file**

Overwrite `apps/web/src/app/(dashboard)/dashboard/page.tsx` with:

```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StatCard } from '@/components/admin/StatCard';
import { usePageHeader } from '@/components/admin/PageHeaderProvider';

interface Stats {
  totalClients: number;
  totalGuests: number;
  totalWishes: number;
  totalGifts: number;
}

const STAT_DEFS: Array<{
  key: keyof Stats;
  label: string;
  accent: string;
}> = [
  { key: 'totalClients', label: 'Total Klien', accent: '#6366f1' },
  { key: 'totalGuests', label: 'Total Tamu', accent: '#10b981' },
  { key: 'totalWishes', label: 'Total Ucapan', accent: '#f59e0b' },
  { key: 'totalGifts', label: 'Total Hadiah', accent: '#3b82f6' },
];

export default function DashboardPage() {
  usePageHeader({ title: 'Dashboard', subtitle: 'Ringkasan platform undangan kamu' });

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/clients/stats/overview')
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_DEFS.map((def) => (
        <StatCard
          key={def.key}
          accentColor={def.accent}
          label={def.label}
          value={stats?.[def.key] ?? 0}
          loading={loading}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 3: Manual verification**

`http://localhost:3000/dashboard` shows: topbar title "Dashboard" with subtitle "Ringkasan platform undangan kamu". Below: 4 stat cards in a row, each with a vertical colored accent bar on the left, uppercase muted label, large value.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat(web): redesign dashboard page with StatCards and page-header hook"
```

---

## Task 13: Rewrite the clients list page

**Files:**
- Modify: `apps/web/src/app/(dashboard)/clients/page.tsx`

**Why:** This is the headline page. Full UI rewrite: stats row above the table, panel chrome with filter tabs, theme chip with colored dot, status toggle (Aktif/Nonaktif), whole-row click → detail, kebab menu with only "Hapus", venue under couple name. Data fetching logic preserved; the response shape change is that `templateId` is now a populated object.

- [ ] **Step 1: Replace the file**

Overwrite `apps/web/src/app/(dashboard)/clients/page.tsx` with:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical } from 'lucide-react';
import api from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatCard } from '@/components/admin/StatCard';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { usePageHeader } from '@/components/admin/PageHeaderProvider';

interface PopulatedTemplate {
  _id: string;
  name: string;
  slug: string;
  config?: { primaryColor?: string };
}

interface ClientRow {
  _id: string;
  groomName: string;
  brideName: string;
  slug: string;
  venue?: string;
  status: 'draft' | 'published';
  eventDate: string;
  createdAt: string;
  templateId?: string | PopulatedTemplate | null;
}

type FilterTab = 'all' | 'active' | 'inactive';

interface OverviewStats {
  totalClients: number;
  totalGuests: number;
  totalWishes: number;
  totalGifts: number;
}

function getTemplate(client: ClientRow): PopulatedTemplate | null {
  const t = client.templateId;
  if (t && typeof t === 'object' && '_id' in t) return t as PopulatedTemplate;
  return null;
}

function formatDateID(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [pendingDelete, setPendingDelete] = useState<ClientRow | null>(null);

  const total = clients.length;
  const activeCount = clients.filter((c) => c.status === 'published').length;
  const inactiveCount = total - activeCount;
  const newThisMonth = clients.filter((c) => isThisMonth(c.createdAt)).length;

  usePageHeader(
    {
      title: 'Daftar Undangan',
      subtitle: loading ? 'Memuat...' : `${total} undangan · ${activeCount} aktif`,
      action: { label: 'Buat Undangan', icon: Plus, href: '/clients/new' },
    },
    [loading, total, activeCount]
  );

  useEffect(() => {
    Promise.all([
      api.get('/clients').then(({ data }) => setClients(data.clients)),
      api
        .get('/clients/stats/overview')
        .then(({ data }) => setOverview(data.stats))
        .catch(() => {}),
    ])
      .catch(() => setError('Gagal memuat undangan'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'active') return clients.filter((c) => c.status === 'published');
    if (filter === 'inactive') return clients.filter((c) => c.status !== 'published');
    return clients;
  }, [clients, filter]);

  const handleToggle = async (client: ClientRow) => {
    const newStatus = client.status === 'published' ? 'draft' : 'published';
    setTogglingId(client._id);
    try {
      await api.put(`/clients/${client._id}`, { status: newStatus });
      setClients((prev) =>
        prev.map((c) => (c._id === client._id ? { ...c, status: newStatus } : c))
      );
    } catch {
      setError('Gagal memperbarui status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/clients/${id}`);
      setClients((prev) => prev.filter((c) => c._id !== id));
      setPendingDelete(null);
    } catch {
      setError('Gagal menghapus undangan');
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accentColor="#6366f1"
          label="Total Undangan"
          value={total}
          sub={loading ? undefined : `+${newThisMonth} bulan ini`}
          loading={loading}
        />
        <StatCard
          accentColor="#10b981"
          label="Total RSVP"
          value={overview?.totalGuests ?? '—'}
          sub={overview ? 'tamu terdaftar' : undefined}
          loading={loading}
        />
        <StatCard
          accentColor="#f59e0b"
          label="Total Views"
          value="—"
          sub="belum diaktifkan"
          loading={false}
        />
        <StatCard
          accentColor="#3b82f6"
          label="Aktif"
          value={activeCount}
          sub={`${inactiveCount} nonaktif`}
          loading={loading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table panel */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-card">
        {/* Bar */}
        <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Semua Undangan</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {total}
            </span>
          </div>
          <div className="flex gap-1">
            {(['all', 'active', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
                  filter === tab
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab === 'all' ? 'Semua' : tab === 'active' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>
        </div>

        {/* Head */}
        <div className="grid grid-cols-[2fr_1fr_1.2fr_90px_140px_40px] gap-2.5 border-b border-border bg-muted px-[18px] py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          <div>Pasangan & Venue</div>
          <div>Tema</div>
          <div>Tanggal</div>
          <div>RSVP</div>
          <div>Aktif</div>
          <div />
        </div>

        {loading ? (
          <div className="space-y-1 p-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {clients.length === 0 ? 'Belum ada undangan.' : 'Tidak ada undangan pada filter ini.'}
            </p>
            {clients.length === 0 && (
              <Button asChild variant="outline" className="mt-4">
                <a href="/clients/new">Buat undangan pertama</a>
              </Button>
            )}
          </div>
        ) : (
          filtered.map((client) => {
            const template = getTemplate(client);
            const themeColor = template?.config?.primaryColor ?? '#6b7280';
            const themeName = template?.name ?? 'Tanpa tema';
            return (
              <div
                key={client._id}
                onClick={() => router.push(`/clients/${client._id}`)}
                className="grid cursor-pointer grid-cols-[2fr_1fr_1.2fr_90px_140px_40px] items-center gap-2.5 border-t border-border px-[18px] py-3.5 transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-foreground">
                    {client.groomName} & {client.brideName}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {client.venue || client.slug}
                  </div>
                </div>
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${themeColor}1a`,
                      color: themeColor,
                      border: `1px solid ${themeColor}33`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                    {themeName}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{formatDateID(client.eventDate)}</div>
                <div className="text-[13px] font-semibold text-muted-foreground">—</div>
                <div className="flex items-center gap-2">
                  <StatusToggle
                    checked={client.status === 'published'}
                    onChange={() => handleToggle(client)}
                    loading={togglingId === client._id}
                  />
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: client.status === 'published' ? '#10b981' : '#d1d5db' }}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {client.status === 'published' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete(client)}
                      >
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus undangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus permanen{' '}
              <strong>
                {pendingDelete?.groomName} & {pendingDelete?.brideName}
              </strong>{' '}
              beserta semua tamu, ucapan, dan hadiah. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && handleDelete(pendingDelete._id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes. If `Button size="icon-sm"` is not defined in this codebase's Button variants, change to `size="icon"`.

- [ ] **Step 3: Manual verification**

`http://localhost:3000/clients`:
- Topbar: "Daftar Undangan" + "{n} undangan · {m} aktif" + amber "+ Buat Undangan" button.
- 4 stat cards (Total Undangan, Total RSVP, Total Views, Aktif) above the table.
- Table panel header bar with title + count badge + filter pills (Semua/Aktif/Nonaktif).
- Each row: couple name + venue (or slug); theme chip with colored dot; date; "—" for RSVP; toggle + dot + Aktif/Nonaktif; kebab menu.
- Click row → navigates to `/clients/{id}`.
- Click toggle → flips status without navigating.
- Kebab → "Hapus" → confirmation dialog → deletes.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(dashboard)/clients/page.tsx
git commit -m "feat(web): rewrite clients list with V2 stats, filter tabs, status toggle, and row click"
```

---

## Task 14: Update New Client wizard (venue field + page header)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/clients/new/page.tsx`

**Why:** Add the `venue` (Lokasi Acara) field to Step 1, switch to Indonesian copy, use `usePageHeader` for the topbar so the existing custom h1 + back link can be removed (the back arrow lives in the sidebar / browser back; topbar shows the title).

- [ ] **Step 1: Add venue to BasicInfo and form**

In `apps/web/src/app/(dashboard)/clients/new/page.tsx`:

**(a)** Update the `BasicInfo` interface (around line 30) to include `venue: string`:

```ts
interface BasicInfo {
  groomName: string;
  brideName: string;
  slug: string;
  eventDate: string;
  venue: string;
}
```

**(b)** Update the initial state in `NewClientPage` (around line 600) to include `venue: ''`:

```ts
  const [info, setInfo] = useState<BasicInfo>({
    groomName: '',
    brideName: '',
    slug: '',
    eventDate: '',
    venue: '',
  });
```

**(c)** In `Step1` (around line 130), add a venue field below the Event Date field. After the closing `</div>` of the Event Date block (around line 209), before the closing `</div>` of `Step1`, insert:

```tsx
      <div className="space-y-1.5">
        <Label>Lokasi Acara</Label>
        <Input
          placeholder="Contoh: Gedung Serbaguna, Jakarta"
          value={info.venue}
          onChange={(e) => onChange({ ...info, venue: e.target.value })}
        />
      </div>
```

**(d)** Update `canAdvance` (around line 614) to require venue too:

```ts
  const canAdvance = () => {
    if (step === 1) return !!(info.groomName && info.brideName && info.slug && info.eventDate && info.venue);
    return true;
  };
```

**(e)** Update the `handleCreate` payload (around line 625) to send venue:

```ts
      const payload: Record<string, unknown> = {
        groomName: info.groomName,
        brideName: info.brideName,
        slug: info.slug,
        eventDate: info.eventDate,
        venue: info.venue,
        status: publish ? 'published' : 'draft',
        ...(templateId && { templateId }),
        ...(sections.length > 0 && { sections }),
      };
```

- [ ] **Step 2: Add page header and remove custom h1**

In the same file, at the top of `NewClientPage`, add the import and call:

```ts
import { usePageHeader } from '@/components/admin/PageHeaderProvider';
```

Inside `NewClientPage` (after the state declarations), add:

```ts
  usePageHeader({ title: 'Buat Undangan Baru', subtitle: 'Isi data pasangan & acara' });
```

Then **delete** the existing `{/* Header */}` block (around lines 660–670) — the `Link to /clients` and the `<h1>New Client</h1>` and the surrounding `<div className="pb-5 border-b border-border">`. The topbar now provides the title; the sidebar provides navigation back to clients.

- [ ] **Step 3: Translate the rest of the wizard copy to Indonesian**

In the same file, translate the visible English strings:

- `STEPS` (line 54): change labels to `'Info Dasar'`, `'Tema & Section'`, `'Tamu'`, `'Tinjau'`.
- `Step1` description (line 147): `"Isi nama pasangan dan tanggal pernikahan untuk memulai."`
- `Step1` field labels: `Groom Name` → `Nama Mempelai Pria`, `Bride Name` → `Nama Mempelai Wanita`, `Slug (URL identifier)` → `Slug (URL)`, `Event Date` → `Tanggal Acara`, `Pick a date` → `Pilih tanggal`.
- `Step2` description (line 320): `"Pilih tema undangan. Bisa diganti nanti."`
- `Step2` add-section button (line 366): `'Batal'` and `'+ Tambah Section'`.
- `Step2` skip note (line 434): `"Lewati langkah ini untuk mengatur tema kemudian."`
- `Step3` description: `"Tambah tamu sekarang atau lewati — bisa ditambah lagi setelahnya."`
- `Step3` table headers: `'Nama'`, `'Nama di Undangan'`, `'Telepon'`, `'Kategori'`. Add row button: `'+ Tambah Baris'`.
- `Step4` description: `"Tinjau detail sebelum membuat undangan."`
- `Step4` Row labels: `'Mempelai Pria'`, `'Mempelai Wanita'`, `'Slug'`, `'Tanggal Acara'`, `'Tema'`, `'Section'`, `'Tamu yang ditambahkan'`. Values like `'None (set later)'` → `'Belum dipilih (atur nanti)'`, `'None'` → `'Belum ada'`, `'None (add later)'` → `'Belum ada (tambah nanti)'`.
- `Step4` summary footnote: `"Setelah dibuat, kamu akan diarahkan ke halaman detail untuk menambah event, foto, dan tamu lainnya."`
- Bottom buttons: `'Back'` → `'Kembali'`, `'Next'` → `'Lanjut'`, `'Save as Draft'` → `'Simpan sebagai Draft'`, `'Create & Publish'` → `'Buat & Terbitkan'`, `'Creating...'` → `'Membuat...'`.
- Error fallback (around line 651): `'Gagal membuat undangan'`.
- `GUEST_CATEGORIES` labels (line 61): `'Family'` → `'Keluarga'`, `'Friend'` → `'Teman'`, `'Office Friend'` → `'Teman Kantor'`, `"Father's Friend"` → `'Teman Ayah'`, `"Mother's Friend"` → `'Teman Ibu'`, `'Neighbor'` → `'Tetangga'`, `'Other'` → `'Lainnya'`.

- [ ] **Step 4: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 5: Manual verification**

`http://localhost:3000/clients/new`:
- Topbar: "Buat Undangan Baru" + "Isi data pasangan & acara".
- No in-page h1.
- Step 1 has 5 fields: Nama Mempelai Pria, Nama Mempelai Wanita, Slug, Tanggal Acara, Lokasi Acara.
- "Lanjut" button disabled until all 5 are filled.
- All wizard copy in Indonesian.
- Submit creates the client with `venue` in the payload (verify via network tab or by checking the new client's `venue` shows on the detail page later).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(dashboard)/clients/new/page.tsx
git commit -m "feat(web): add venue field to new-client wizard and translate to Indonesian"
```

---

## Task 15: Update client detail page (page header + summary chips)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/clients/[id]/page.tsx`

**Why:** Use `usePageHeader` for the topbar (title = couple, subtitle = date · venue, action = "Lihat Undangan" link to public invitation in new tab). Add summary chips above the tabs row. Existing tab content is left alone — only the page-level header and chip bar change.

- [ ] **Step 1: Open the file and locate the header section**

Read `apps/web/src/app/(dashboard)/clients/[id]/page.tsx`. Locate where the page renders its current header (look for the `{client.groomName}` and `{client.brideName}` JSX, or a heading element near the top of the return). The exact lines vary, but the pattern is: an in-page h1/h2 with the couple name and an explicit "View Invitation" link.

- [ ] **Step 2: Add imports and the hook**

At the top of the file, add (alongside existing imports):

```ts
import { ExternalLink } from 'lucide-react';
import { usePageHeader } from '@/components/admin/PageHeaderProvider';
```

After the client is loaded (i.e. inside the component, after the state that holds the loaded client — the variable is likely called `client` or similar), add:

```ts
  const invitationUrl =
    client && (process.env.NEXT_PUBLIC_INVITATION_URL || 'http://localhost:3001') + '/' + client.slug;

  usePageHeader(
    {
      title: client ? `${client.groomName} & ${client.brideName}` : 'Memuat...',
      subtitle: client
        ? `${new Date(client.eventDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}${client.venue ? ` · ${client.venue}` : ''}`
        : undefined,
      action: client
        ? {
            label: 'Lihat Undangan',
            icon: ExternalLink,
            href: invitationUrl,
            target: '_blank',
          }
        : undefined,
    },
    [client?._id, client?.groomName, client?.brideName, client?.eventDate, client?.venue, client?.slug]
  );
```

- [ ] **Step 3: Remove the old in-page header**

Delete the existing in-page header (the h1/h2 with the couple name and the in-page "View Invitation" link/button if present). Keep the tabs and content below intact. The topbar now carries title/subtitle/action.

- [ ] **Step 4: Add summary chips above the tabs**

Just above the `<Tabs>` element (or wherever tabs start), insert a chip row. Use the existing `Badge` component (`@/components/ui/badge`).

```tsx
{client && (
  <div className="mb-4 flex flex-wrap gap-2">
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: client.status === 'published' ? '#10b98120' : '#9ca3af20',
        color: client.status === 'published' ? '#047857' : '#4b5563',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: client.status === 'published' ? '#10b981' : '#9ca3af' }}
      />
      {client.status === 'published' ? 'Aktif' : 'Draft'}
    </span>
    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {new Date(client.eventDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}
    </span>
    {client.venue && (
      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
        {client.venue}
      </span>
    )}
  </div>
)}
```

Add `import { Badge } from '@/components/ui/badge';` only if you decide to use the Badge primitive instead of the inline spans above. The inline spans above are self-contained and don't require Badge.

- [ ] **Step 5: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 6: Manual verification**

`http://localhost:3000/clients/{some-id}`:
- Topbar shows couple name as title, "{long-date} · {venue}" as subtitle, "Lihat Undangan" amber button on the right that opens the public invitation in a new tab.
- Summary chips row visible: status pill (green dot for published, gray for draft), date pill, venue pill (if venue set).
- Tabs and tab content unchanged in functionality.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(dashboard)/clients/[id]/page.tsx
git commit -m "feat(web): add page-header and summary chips to client detail page"
```

---

## Task 16: Update templates list page

**Files:**
- Modify: `apps/web/src/app/(dashboard)/templates/page.tsx`

**Why:** Hook into the topbar with `usePageHeader`, wrap the existing template grid in panel chrome.

- [ ] **Step 1: Read the file to locate the in-page header**

Read `apps/web/src/app/(dashboard)/templates/page.tsx`. Identify the in-page h1/title (likely "Templates" or "Tema") and the surrounding container.

- [ ] **Step 2: Add the page header hook**

At the top of the file, add:

```ts
import { usePageHeader } from '@/components/admin/PageHeaderProvider';
```

Inside the component, after the state declarations and after `templates` is loaded (so the count is known), call:

```ts
  usePageHeader(
    { title: 'Tema', subtitle: `${templates.length} tema tersedia` },
    [templates.length]
  );
```

- [ ] **Step 3: Remove the in-page header**

Delete the in-page h1/title block. Keep the grid of cards.

- [ ] **Step 4: Wrap the grid in panel chrome (optional, only if it improves visual consistency)**

If the existing layout already has a clean panel-style container, leave it. If not, wrap the grid in:

```tsx
<div className="overflow-hidden rounded-[10px] border border-border bg-card">
  <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-foreground">Semua Tema</span>
      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
        {templates.length}
      </span>
    </div>
  </div>
  <div className="p-4">
    {/* existing grid of template cards */}
  </div>
</div>
```

- [ ] **Step 5: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 6: Manual verification**

`http://localhost:3000/templates`: topbar "Tema" + "{n} tema tersedia". Templates render in white panel below.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(dashboard)/templates/page.tsx
git commit -m "feat(web): add page-header to templates list"
```

---

## Task 17: Update template edit page

**Files:**
- Modify: `apps/web/src/app/(dashboard)/templates/[id]/page.tsx`

**Why:** Hook into the topbar with template name as title and "Simpan" as the action callback. Replace the in-page save button.

- [ ] **Step 1: Read the file to find the save handler**

Read `apps/web/src/app/(dashboard)/templates/[id]/page.tsx`. Locate the function that submits the form (likely called `handleSubmit` or `handleSave`) and the existing in-page save button.

- [ ] **Step 2: Add the page header hook**

At the top, add:

```ts
import { usePageHeader } from '@/components/admin/PageHeaderProvider';
```

Inside the component, after the template is loaded:

```ts
  usePageHeader(
    {
      title: template?.name ?? 'Memuat...',
      subtitle: 'Edit tema',
      action: template
        ? { label: 'Simpan', onClick: handleSubmit, loading: saving }
        : undefined,
    },
    [template?._id, template?.name, saving]
  );
```

(Substitute `handleSubmit` and `saving` with the actual function name and loading state from this file.)

- [ ] **Step 3: Remove the in-page save button**

Delete the existing in-page "Save"/"Simpan" button. Keep the form fields.

- [ ] **Step 4: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 5: Manual verification**

`http://localhost:3000/templates/{id}`: topbar shows template name + "Edit tema" + amber "Simpan" button. Clicking the button submits the form.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(dashboard)/templates/[id]/page.tsx
git commit -m "feat(web): add page-header to template edit page"
```

---

## Task 18: Update settings page

**Files:**
- Modify: `apps/web/src/app/(dashboard)/settings/page.tsx`

**Why:** Page-header hook + wrap content in panel chrome.

- [ ] **Step 1: Add the page header hook**

In `apps/web/src/app/(dashboard)/settings/page.tsx`, add at the top:

```ts
import { usePageHeader } from '@/components/admin/PageHeaderProvider';
```

Inside the component, near the top:

```ts
  usePageHeader({ title: 'Pengaturan', subtitle: 'Akun & preferensi' });
```

If the settings page has a savable form, also pass an `action: { label: 'Simpan', onClick: handleSave, loading: saving }` (mirroring Task 17). If it doesn't have a save button, omit the `action`.

- [ ] **Step 2: Remove the in-page header**

Delete the in-page h1/title block.

- [ ] **Step 3: Wrap in panel chrome**

Wrap the page content in:

```tsx
<div className="overflow-hidden rounded-[10px] border border-border bg-card p-6">
  {/* existing settings content */}
</div>
```

- [ ] **Step 4: Verify type-check passes**

Run: `cd apps/web && npm run lint`
Expected: passes.

- [ ] **Step 5: Manual verification**

`http://localhost:3000/settings`: topbar "Pengaturan" + "Akun & preferensi". Content in white panel.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(dashboard)/settings/page.tsx
git commit -m "feat(web): add page-header to settings page"
```

---

## Task 19: Final pass — check & polish

**Files:**
- Various (verification only; small fixes if issues are found)

**Why:** A redesign of this scope inevitably surfaces small issues only visible end-to-end (broken focus rings, off-by-one alignment, dropdown text contrast on dark sidebar, tooltip styles). This task is a single pass to find and fix them.

- [ ] **Step 1: Run a full build**

Run: `npm run build` from project root.
Expected: all three apps build successfully (web, invitation, server). If `apps/web` fails, fix the error and re-run.

- [ ] **Step 2: Manual smoke test (auth)**

Open `http://localhost:3000/login`. Verify dark page bg, centered card, logo, Indonesian copy, amber submit. Click "Daftar di sini" → register page mirrors. Sign in → redirects to `/dashboard`.

- [ ] **Step 3: Manual smoke test (every dashboard page)**

For each route, verify topbar title/subtitle/action and that page content renders without console errors:
- `/dashboard` — 4 stat cards, no action button.
- `/clients` — stats + table panel, "+ Buat Undangan" action, filter tabs work, row click navigates, status toggle flips, kebab → Hapus → confirm dialog deletes.
- `/clients/new` — wizard, venue field on Step 1, Indonesian copy, can submit.
- `/clients/{id}` — couple name in topbar, "Lihat Undangan" opens public invite in new tab, summary chips, tabs functional.
- `/templates` — "Tema" title + count subtitle, panel with grid.
- `/templates/{id}` — name in topbar, "Simpan" action submits.
- `/settings` — "Pengaturan" title.

- [ ] **Step 4: Sidebar on small screens**

Resize browser to under 768px. Verify the sidebar collapses to the mobile sheet (shadcn behavior), the `SidebarTrigger` button appears in the topbar, search field hides, clicking trigger opens sheet.

- [ ] **Step 5: Inspect for visual issues**

Look specifically for:
- Sidebar nav item text color on hover (should remain readable, not black-on-navy).
- Active sidebar item: amber tint visible, amber text legible.
- Dropdown menus on the clients table: white bg with dark text (default), readable.
- Status toggle: amber when on, gray when off, sliding circle smooth.
- Stat card accent bar: 3px wide, full height, correct color per card.
- Topbar: 56px tall, white bg, page title prominent, subtitle muted.

If any visual issue is found, fix the offending file (likely small Tailwind class tweaks). Otherwise proceed.

- [ ] **Step 6: Commit any final fixes (only if needed)**

```bash
git add -A
git commit -m "polish(web): fix V2 redesign visual nits"
```

If no fixes were needed, skip this step.

---

## Self-review notes (recorded during plan writing)

- **Spec coverage:** Every spec section is mapped to tasks: §5 tokens → T1; §6.1 Logo → T2; §6.2 StatCard → T4; §6.3 StatusToggle → T5; §6.4 AuthCard + (auth) layout → T9; §6.5 PageHeaderProvider → T3; §6.6 sidebar + §6.7 topbar → T8; §7.1 auth pages → T10/T11; §7.2 dashboard → T12; §7.3 clients list → T13; §7.4 new client → T14; §7.5 client detail → T15; §7.6 templates list → T16; §7.7 template edit → T17; §7.8 settings → T18; §8.1 venue + §8.3 shared types → T6; §8.2 populate → T7. Final pass → T19.
- **Type consistency:** `PageHeaderState`, `usePageHeader(state, deps)`, `<StatCard accentColor label value sub loading>`, `<StatusToggle checked onChange loading disabled>`, `<AuthCard title subtitle children footer>`, `<Logo size className>` — all match across tasks.
- **No placeholders** — every code step shows the actual code; no "implement later" or "similar to above" without code.
- **Note about `Button size="icon-sm"`:** Task 8/13 mention this size which the author wasn't 100% sure existed. Steps include a fallback instruction to substitute `size="icon"` if the build fails. Acceptable since the verification step catches it immediately.
