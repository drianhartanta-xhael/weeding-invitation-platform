'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, Heart, Gift } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalClients: number;
  totalGuests: number;
  totalWishes: number;
  totalGifts: number;
}

const statCards = [
  { key: 'totalClients' as const, label: 'Total Clients', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'totalGuests' as const, label: 'Total Guests', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'totalWishes' as const, label: 'Total Wishes', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
  { key: 'totalGifts' as const, label: 'Total Gifts', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50' },
];

export default function DashboardPage() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your wedding invitation platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stats?.[key] ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
