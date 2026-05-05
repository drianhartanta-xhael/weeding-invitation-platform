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
