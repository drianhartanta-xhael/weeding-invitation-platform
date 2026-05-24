'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import api from '@/lib/api';
import type { BulkGuestRow, Guest, GuestCategory } from '../../types';
import { slugify, normalizePhone, categoryLabel } from '../../helpers';
import { GUEST_CATEGORIES } from '../../constants';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onImported: (guests: Guest[]) => void;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

const NONE = '__none__';
const FIRSTLAST = '__firstlast__';
type TargetField = 'name' | 'invitationName' | 'phone' | 'category';

function detect(columns: string[], candidates: string[]): string {
  const lower = columns.map((c) => c.toLowerCase().trim());
  const idx = lower.findIndex((c) => candidates.includes(c));
  return idx >= 0 ? columns[idx] : '';
}

export default function ImportGuestsDialog({ open, onOpenChange, clientId, onImported, setError, setSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<TargetField, string>>({
    name: '', invitationName: NONE, phone: NONE, category: NONE,
  });

  const firstCol = detect(columns, ['first name']);
  const lastCol = detect(columns, ['last name']);
  const hasFirstLast = firstCol !== '' && lastCol !== '';

  const downloadTemplate = () => {
    const csv = 'name,invitationName,phone,category\nJohn Doe,Mr. & Mrs. Doe,08123456789,friend\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = (res.meta.fields || []).filter(Boolean) as string[];
        setColumns(cols);
        setRows(res.data);
        const nameCol = detect(cols, ['name', 'full name', 'display name', 'nama']);
        const fl = detect(cols, ['first name']) && detect(cols, ['last name']);
        setMapping({
          name: nameCol || (fl ? FIRSTLAST : ''),
          invitationName: detect(cols, ['invitationname', 'invitation name']) || NONE,
          phone: detect(cols, ['phone', 'mobile', 'phone 1 - value', 'whatsapp', 'no hp', 'nomor']) || NONE,
          category: detect(cols, ['category', 'kategori']) || NONE,
        });
      },
    });
  };

  const cellOf = (row: Record<string, string>, col: string): string => {
    if (col === FIRSTLAST) {
      return [row[firstCol], row[lastCol]].filter(Boolean).join(' ').trim();
    }
    if (!col || col === NONE) return '';
    return (row[col] || '').trim();
  };

  const preview: BulkGuestRow[] = rows
    .map((row) => {
      const name = cellOf(row, mapping.name);
      const invitationName = cellOf(row, mapping.invitationName) || name;
      const rawPhone = cellOf(row, mapping.phone);
      const np = normalizePhone(rawPhone);
      const catRaw = cellOf(row, mapping.category).toLowerCase();
      const category = (GUEST_CATEGORIES.some((c) => c.value === catRaw) ? catRaw : 'other') as GuestCategory;
      return { name, invitationName, slug: slugify(name), phone: np || rawPhone, category };
    })
    .filter((r) => r.name);

  const doImport = async () => {
    if (preview.length === 0) return;
    try {
      const { data } = await api.post(`/guests/bulk/${clientId}`, { guests: preview });
      onImported(data.guests);
      setSuccess(`${data.created ?? data.guests.length} imported${data.updated ? `, ${data.updated} updated` : ''}`);
      setTimeout(() => setSuccess(''), 3000);
      setColumns([]);
      setRows([]);
      if (fileRef.current) fileRef.current.value = '';
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import guests');
    }
  };

  const fieldSelect = (field: TargetField, label: string, required = false) => (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}{required && ' *'}</label>
      <Select value={mapping[field] || NONE} onValueChange={(v) => setMapping((m) => ({ ...m, [field]: v }))}>
        <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value={NONE}>— none —</SelectItem>}
          {field === 'name' && hasFirstLast && <SelectItem value={FIRSTLAST}>First + Last name</SelectItem>}
          {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import guests</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>Download template</Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:text-sm file:bg-background hover:file:bg-muted"
            />
          </div>

          {columns.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">Map your columns to guest fields:</p>
              <div className="grid grid-cols-2 gap-3">
                {fieldSelect('name', 'Name', true)}
                {fieldSelect('invitationName', 'Invitation name')}
                {fieldSelect('phone', 'Phone')}
                {fieldSelect('category', 'Category')}
              </div>

              {preview.length > 0 ? (
                <>
                  <p className="text-sm font-medium">{preview.length} guests ready:</p>
                  <div className="max-h-60 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Invitation</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 50).map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.name}</TableCell>
                            <TableCell className="text-muted-foreground">{r.invitationName}</TableCell>
                            <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                            <TableCell>{categoryLabel(r.category)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button size="sm" onClick={doImport}>Import {preview.length} guests</Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Map a Name column to see a preview.</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
