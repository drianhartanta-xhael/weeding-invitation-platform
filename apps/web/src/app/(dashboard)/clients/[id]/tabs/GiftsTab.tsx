'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Client, Gift } from '../types';
import { formatDate, formatCurrency } from '../helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  client: Client;
  setError: (msg: string) => void;
}

export default function GiftsTab({ client, setError }: Props) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftsLoaded, setGiftsLoaded] = useState(false);

  useEffect(() => {
    api
      .get(`/gifts/client/${client._id}`)
      .then(({ data }) => { setGifts(data.gifts); setGiftsLoaded(true); })
      .catch(() => setError('Failed to load gifts'));
  }, [client._id]);

  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    if (status === 'success') return 'default';
    if (status === 'failed') return 'destructive';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Gifts {giftsLoaded && <span className="text-muted-foreground font-normal text-sm ml-1">({gifts.length})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!giftsLoaded ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : gifts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No gifts yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.map((g) => (
                  <TableRow key={g._id}>
                    <TableCell className="font-medium">{g.guestName}</TableCell>
                    <TableCell>{formatCurrency(g.amount)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{g.message || '-'}</TableCell>
                    <TableCell><Badge variant={statusVariant(g.status)}>{g.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(g.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
