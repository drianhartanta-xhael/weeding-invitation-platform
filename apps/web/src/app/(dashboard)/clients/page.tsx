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
