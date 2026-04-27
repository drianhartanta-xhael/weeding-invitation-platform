'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Papa from 'papaparse';
import api from '@/lib/api';
import type { Client, Guest, BulkGuestRow, GuestCategory } from '../types';
import { GUEST_CATEGORIES, EMPTY_BULK_ROW } from '../constants';
import { categoryLabel, slugify } from '../helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  setSuccess: (msg: string) => void;
}

export default function GuestsTab({ client, setError, setSuccess }: Props) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoaded, setGuestsLoaded] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', invitationName: '', slug: '', phone: '', category: 'other' as GuestCategory });
  const [guestSlugTouched, setGuestSlugTouched] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkGuestRow[]>([{ ...EMPTY_BULK_ROW }]);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvPreview, setCsvPreview] = useState<BulkGuestRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const paginatedGuests = useMemo(
    () => guests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [guests, page]
  );
  const totalPages = Math.ceil(guests.length / PAGE_SIZE);

  const handleExportCSV = () => {
    const rows = guests.map((g) => ({
      Name: g.name,
      'Invitation Name': g.invitationName,
      Slug: g.slug,
      Category: categoryLabel(g.category),
      Phone: g.phone || '',
      RSVP: g.rsvpStatus,
      'Num Guests': g.numberOfGuests,
    }));
    const header = Object.keys(rows[0]).join(',');
    const body = rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${client.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    api
      .get(`/guests/client/${client._id}`)
      .then(({ data }) => { setGuests(data.guests); setGuestsLoaded(true); })
      .catch(() => setError('Failed to load guests'));
  }, [client._id]);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/guests', { ...newGuest, clientId: client._id });
      setGuests([data.guest, ...guests]);
      setNewGuest({ name: '', invitationName: '', slug: '', phone: '', category: 'other' });
      setGuestSlugTouched(false);
      setShowAddGuest(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add guest');
    }
  };

  const handleDeleteGuest = async (id: string) => {
    try {
      await api.delete(`/guests/${id}`);
      setGuests(guests.filter((g) => g._id !== id));
    } catch {
      setError('Failed to delete guest');
    }
  };

  const handleBulkRowChange = (index: number, field: keyof BulkGuestRow, value: string) => {
    const updated = [...bulkRows];
    (updated[index] as any)[field] = value;
    if (field === 'name' && !updated[index].slug) updated[index].slug = slugify(value);
    if (field === 'name' && !updated[index].invitationName) updated[index].invitationName = value;
    setBulkRows(updated);
  };

  const handleBulkSubmit = async () => {
    const valid = bulkRows.filter((r) => r.name.trim());
    if (valid.length === 0) return;
    const payload = valid.map((r) => ({
      ...r,
      slug: r.slug || slugify(r.name),
      invitationName: r.invitationName || r.name,
    }));
    try {
      const { data } = await api.post(`/guests/bulk/${client._id}`, { guests: payload });
      setGuests([...data.guests, ...guests]);
      setBulkRows([{ ...EMPTY_BULK_ROW }]);
      setShowBulkAdd(false);
      setSuccess(`${data.guests.length} guests added`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to bulk add guests');
    }
  };

  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase(),
      complete: (results) => {
        const rows: BulkGuestRow[] = results.data.map((row: any) => ({
          name: row.name?.trim() || '',
          invitationName: row.invitationname?.trim() || row.invitation_name?.trim() || row.name?.trim() || '',
          slug: row.slug?.trim() || slugify(row.name || ''),
          phone: row.phone?.trim() || '',
          category: (row.category?.trim() || 'other') as GuestCategory,
        }));
        setCsvPreview(rows.filter((r) => r.name));
      },
    });
  };

  const handleCsvSubmit = async () => {
    if (csvPreview.length === 0) return;
    try {
      const { data } = await api.post(`/guests/bulk/${client._id}`, { guests: csvPreview });
      setGuests([...data.guests, ...guests]);
      setCsvPreview([]);
      setShowCsvUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess(`${data.guests.length} guests imported from CSV`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import CSV');
    }
  };

  const rsvpVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'attending') return 'default';
    if (status === 'notAttending') return 'destructive';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle>
          Guests {guestsLoaded && <span className="text-muted-foreground font-normal text-sm ml-1">({guests.length})</span>}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowCsvUpload(!showCsvUpload); setShowBulkAdd(false); setShowAddGuest(false); }}>
            {showCsvUpload ? 'Cancel CSV' : 'Upload CSV'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowBulkAdd(!showBulkAdd); setShowCsvUpload(false); setShowAddGuest(false); }}>
            {showBulkAdd ? 'Cancel Bulk' : '+ Bulk Add'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowAddGuest(!showAddGuest); setShowBulkAdd(false); setShowCsvUpload(false); }}>
            {showAddGuest ? 'Cancel' : '+ Add Guest'}
          </Button>
          {guestsLoaded && guests.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCsvUpload && (
          <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns: <code className="bg-muted px-1 rounded text-xs">name, invitationName, slug, phone, category</code>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvSelect}
              className="block text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-sm file:bg-background hover:file:bg-muted"
            />
            {csvPreview.length > 0 && (
              <>
                <p className="text-sm font-medium">{csvPreview.length} guests found:</p>
                <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Invitation Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.invitationName}</TableCell>
                          <TableCell className="text-muted-foreground">{row.slug}</TableCell>
                          <TableCell>{categoryLabel(row.category)}</TableCell>
                          <TableCell className="text-muted-foreground">{row.phone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button size="sm" onClick={handleCsvSubmit}>Import {csvPreview.length} Guests</Button>
              </>
            )}
          </div>
        )}

        {showBulkAdd && (
          <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
            {bulkRows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  {i === 0 && <Label className="mb-1.5 block">Name</Label>}
                  <Input value={row.name} placeholder="Name"
                    onChange={(e) => handleBulkRowChange(i, 'name', e.target.value)} />
                </div>
                <div className="col-span-3">
                  {i === 0 && <Label className="mb-1.5 block">Invitation Name</Label>}
                  <Input value={row.invitationName} placeholder="Invitation name"
                    onChange={(e) => handleBulkRowChange(i, 'invitationName', e.target.value)} />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="mb-1.5 block">Slug</Label>}
                  <Input value={row.slug} placeholder="auto"
                    onChange={(e) => handleBulkRowChange(i, 'slug', e.target.value)} />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="mb-1.5 block">Category</Label>}
                  <Select value={row.category} onValueChange={(v) => handleBulkRowChange(i, 'category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GUEST_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  {i === 0 && <Label className="mb-1.5 block">Phone</Label>}
                  <Input value={row.phone} placeholder="Phone"
                    onChange={(e) => handleBulkRowChange(i, 'phone', e.target.value)} />
                </div>
                <div className="col-span-1">
                  {i === 0 && <div className="mb-1.5 h-5" />}
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive w-full"
                    disabled={bulkRows.length <= 1}
                    onClick={() => setBulkRows(bulkRows.filter((_, idx) => idx !== i))}>
                    ×
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <Button variant="outline" size="sm" onClick={() => setBulkRows([...bulkRows, { ...EMPTY_BULK_ROW }])}>
                + Add Row
              </Button>
              <Button size="sm" onClick={handleBulkSubmit}>
                Submit {bulkRows.filter((r) => r.name.trim()).length} Guests
              </Button>
            </div>
          </div>
        )}

        {showAddGuest && (
          <form onSubmit={handleAddGuest} className="p-4 bg-muted/40 rounded-lg border space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={newGuest.name} required
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setNewGuest({ ...newGuest, name, slug: guestSlugTouched ? newGuest.slug : autoSlug });
                  }} />
              </div>
              <div className="space-y-1.5">
                <Label>Invitation Name</Label>
                <Input value={newGuest.invitationName} required placeholder="Name shown on invitation"
                  onChange={(e) => setNewGuest({ ...newGuest, invitationName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={newGuest.slug} required placeholder="e.g. bapak-ibu-tono"
                  onChange={(e) => { setGuestSlugTouched(true); setNewGuest({ ...newGuest, slug: e.target.value }); }} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={newGuest.category} onValueChange={(v) => setNewGuest({ ...newGuest, category: v as GuestCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GUEST_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} />
              </div>
            </div>
            <Button type="submit" size="sm">Add Guest</Button>
          </form>
        )}

        {!guestsLoaded ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : guests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No guests yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>RSVP</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGuests.map((g) => (
                    <TableRow key={g._id}>
                      <TableCell>
                        <p className="font-medium text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.invitationName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{categoryLabel(g.category)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{g.slug}</TableCell>
                      <TableCell>
                        <Badge variant={rsvpVariant(g.rsvpStatus)}>{g.rsvpStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{g.numberOfGuests}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete guest?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {g.name} and all their RSVP data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteGuest(g._id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, guests.length)} of {guests.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
