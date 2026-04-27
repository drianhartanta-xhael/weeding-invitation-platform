'use client';

import { useState } from 'react';
import type { Client } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Props {
  client: Client;
  saving: boolean;
  saveClient: (payload: Record<string, unknown>) => Promise<void>;
}

export default function CoupleTab({ client, saving, saveClient }: Props) {
  const [form, setForm] = useState({
    groomName: client.groomName || '',
    brideName: client.brideName || '',
    groomPhoto: client.groomPhoto || '',
    bridePhoto: client.bridePhoto || '',
    groomParents: { father: client.groomParents?.father || '', mother: client.groomParents?.mother || '' },
    brideParents: { father: client.brideParents?.father || '', mother: client.brideParents?.mother || '' },
  });

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Couple Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Groom</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('Name', form.groomName, (v) => setForm({ ...form, groomName: v }))}
            {field('Photo URL', form.groomPhoto, (v) => setForm({ ...form, groomPhoto: v }), 'https://...')}
            {field("Father's Name", form.groomParents.father, (v) => setForm({ ...form, groomParents: { ...form.groomParents, father: v } }))}
            {field("Mother's Name", form.groomParents.mother, (v) => setForm({ ...form, groomParents: { ...form.groomParents, mother: v } }))}
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bride</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('Name', form.brideName, (v) => setForm({ ...form, brideName: v }))}
            {field('Photo URL', form.bridePhoto, (v) => setForm({ ...form, bridePhoto: v }), 'https://...')}
            {field("Father's Name", form.brideParents.father, (v) => setForm({ ...form, brideParents: { ...form.brideParents, father: v } }))}
            {field("Mother's Name", form.brideParents.mother, (v) => setForm({ ...form, brideParents: { ...form.brideParents, mother: v } }))}
          </div>
        </div>

        <Button disabled={saving} onClick={() => saveClient(form)}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
