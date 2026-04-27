'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Client {
  _id: string;
  groomName: string;
  brideName: string;
  slug: string;
  status: string;
  eventDate: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/clients')
      .then(({ data }) => setClients(data.clients))
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleStatus = async (client: Client) => {
    const newStatus = client.status === 'published' ? 'draft' : 'published';
    setTogglingId(client._id);
    try {
      await api.put(`/clients/${client._id}`, { status: newStatus });
      setClients(clients.map((c) => (c._id === client._id ? { ...c, status: newStatus } : c)));
    } catch {
      setError('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/clients/${id}`);
      setClients(clients.filter((c) => c._id !== id));
    } catch {
      setError('Failed to delete client');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your wedding invitation clients</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card">
          <p className="text-muted-foreground">No clients yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/clients/new">Create your first client</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Couple</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client._id}>
                  <TableCell className="font-medium">
                    {client.groomName} & {client.brideName}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {client.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(client.eventDate).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleStatus(client)} disabled={togglingId === client._id}>
                      <Badge
                        variant={client.status === 'published' ? 'default' : 'secondary'}
                        className="cursor-pointer"
                      >
                        {togglingId === client._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : client.status}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/clients/${client._id}`}>View</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete client?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{client.groomName} & {client.brideName}</strong> and all related guests, wishes, and gifts. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(client._id)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
