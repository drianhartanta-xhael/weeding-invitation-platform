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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  // TooltipProvider lives in the root layout now (apps/web/src/app/layout.tsx).
  return (
    <PageHeaderProvider>
      <DashboardShell>{children}</DashboardShell>
    </PageHeaderProvider>
  );
}
