'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExternalLink, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { Client, Tab } from './types';
import { TABS } from './constants';
import { dateToInput } from './helpers';
import { usePageHeader } from '@/components/admin/PageHeaderProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Skeleton } from '@/components/ui/skeleton';
import OverviewTab from './tabs/OverviewTab';
import CoupleTab from './tabs/CoupleTab';
import EventsTab from './tabs/EventsTab';
import DetailsTab from './tabs/DetailsTab';
import SectionsTab from './tabs/SectionsTab';
import GuestsTab from './tabs/GuestsTab';
import ActivityTab from './tabs/ActivityTab';

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/clients/${params.id}`)
      .then(({ data }) => setClient(data.client))
      .catch(() => setError('Failed to load client'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const invitationUrl = client
    ? `${process.env.NEXT_PUBLIC_INVITATION_URL || 'http://localhost:3001'}/${client.slug}`
    : undefined;

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

  const clearMessages = () => { setError(''); setSuccess(''); };

  const saveClient = async (payload: Record<string, unknown>) => {
    clearMessages();
    setSaving(true);
    try {
      const { data } = await api.put(`/clients/${params.id}`, payload);
      setClient(data.client);
      setSuccess('Saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${params.id}`);
      router.push('/clients');
    } catch {
      setError('Failed to delete client');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Client not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary chips */}
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

      {/* Delete action */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this client?</AlertDialogTitle>
              <AlertDialogDescription>
                All related guests, wishes, and gifts will be permanently deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" onValueChange={() => clearMessages()}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="overview">
            <OverviewTab clientId={client._id} />
          </TabsContent>
          <TabsContent value="couple">
            <CoupleTab client={client} saving={saving} saveClient={saveClient} />
          </TabsContent>
          <TabsContent value="events">
            <EventsTab client={client} saving={saving} saveClient={saveClient} />
          </TabsContent>
          <TabsContent value="details">
            <DetailsTab client={client} saving={saving} saveClient={saveClient} />
          </TabsContent>
          <TabsContent value="sections">
            <SectionsTab client={client} saving={saving} saveClient={saveClient} setError={setError} />
          </TabsContent>
          <TabsContent value="guests">
            <GuestsTab client={client} setError={setError} setSuccess={setSuccess} />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab client={client} setError={setError} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
