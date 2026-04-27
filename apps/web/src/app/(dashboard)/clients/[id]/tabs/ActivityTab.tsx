'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Client, Wish, Gift } from '../types';
import { formatDate, formatCurrency } from '../helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  client: Client;
  setError: (msg: string) => void;
}

export default function ActivityTab({ client, setError }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<'wishes' | 'gifts'>('wishes');

  useEffect(() => {
    Promise.all([
      api.get(`/wishes/client/${client._id}`),
      api.get(`/gifts/client/${client._id}`),
    ])
      .then(([wishRes, giftRes]) => {
        setWishes(wishRes.data.wishes);
        setGifts(giftRes.data.gifts);
        setLoaded(true);
      })
      .catch(() => setError('Failed to load activity'));
  }, [client._id]);

  const handleToggleApprove = async (wish: Wish) => {
    try {
      await api.patch(`/wishes/${wish._id}/approve`, { isApproved: !wish.isApproved });
      setWishes(wishes.map((w) => (w._id === wish._id ? { ...w, isApproved: !w.isApproved } : w)));
    } catch {
      setError('Failed to update wish');
    }
  };

  const handleDeleteWish = async (id: string) => {
    try {
      await api.delete(`/wishes/${id}`);
      setWishes(wishes.filter((w) => w._id !== id));
    } catch {
      setError('Failed to delete wish');
    }
  };

  const giftStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    if (status === 'success') return 'default';
    if (status === 'failed') return 'destructive';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={activeSection === 'wishes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('wishes')}
          >
            Wishes {loaded && <span className="ml-1 opacity-70">({wishes.length})</span>}
          </Button>
          <Button
            variant={activeSection === 'gifts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('gifts')}
          >
            Gifts {loaded && <span className="ml-1 opacity-70">({gifts.length})</span>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : activeSection === 'wishes' ? (
          wishes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No wishes yet.</p>
          ) : (
            <div className="space-y-3">
              {wishes.map((w) => (
                <div
                  key={w._id}
                  className={`p-4 border rounded-lg ${w.isApproved ? '' : 'border-yellow-200 bg-yellow-50/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{w.guestName}</p>
                      <p className="text-muted-foreground text-sm mt-1">{w.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(w.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleApprove(w)}
                      >
                        {w.isApproved ? 'Unapprove' : 'Approve'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this wish?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteWish(w._id)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          gifts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No gifts yet.</p>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell>
                        <Badge variant={giftStatusVariant(g.status)}>{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(g.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
