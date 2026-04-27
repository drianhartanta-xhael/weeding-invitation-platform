'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Client, Wish } from '../types';
import { formatDate } from '../helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  client: Client;
  setError: (msg: string) => void;
}

export default function WishesTab({ client, setError }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishesLoaded, setWishesLoaded] = useState(false);

  useEffect(() => {
    api
      .get(`/wishes/client/${client._id}`)
      .then(({ data }) => { setWishes(data.wishes); setWishesLoaded(true); })
      .catch(() => setError('Failed to load wishes'));
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Wishes {wishesLoaded && <span className="text-muted-foreground font-normal text-sm ml-1">({wishes.length})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!wishesLoaded ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : wishes.length === 0 ? (
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
                    <Button variant="outline" size="sm" onClick={() => handleToggleApprove(w)}>
                      {w.isApproved ? 'Unapprove' : 'Approve'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
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
        )}
      </CardContent>
    </Card>
  );
}
