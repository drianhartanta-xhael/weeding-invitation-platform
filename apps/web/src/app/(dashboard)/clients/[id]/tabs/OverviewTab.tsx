'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ClientStats } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryLabel } from '../helpers';

interface Props {
  clientId: string;
}

export default function OverviewTab({ clientId }: Props) {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    api
      .get(`/clients/${clientId}/stats`)
      .then(({ data }) => { setStats(data.stats); setStatsLoaded(true); })
      .catch(() => {});
  }, [clientId]);

  const statCards = stats ? [
    { label: 'Total Guests', value: stats.totalGuests, color: 'text-blue-600' },
    { label: 'Attending', value: stats.totalAttending, color: 'text-green-600' },
    { label: 'Not Attending', value: stats.totalNotAttending, color: 'text-red-600' },
    { label: 'Pending', value: stats.totalPending, color: 'text-yellow-600' },
    { label: 'Total Attendees', value: stats.totalAttendees, color: 'text-purple-600' },
    { label: 'Page Views', value: stats.views ?? 0, color: 'text-indigo-600' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {!statsLoaded
          ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)
          : statCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="pt-4 text-center">
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {statsLoaded && stats && stats.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guests by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byCategory.map((cat) => {
              const pct = stats.totalGuests > 0 ? Math.round((cat.count / stats.totalGuests) * 100) : 0;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground">{categoryLabel(cat.category)}</span>
                    <span className="text-muted-foreground">{cat.count} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
