'use client';

import { useMemo, useState } from 'react';
import api from '@/lib/api';
import type { Client, Guest } from '../../types';
import { DEFAULT_WA_TEMPLATE, buildWaMessage, invitationUrl, normalizePhone, waLink } from '../../helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SendStatus = 'pending' | 'sent' | 'skipped';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  guests: Guest[];
  onGuestUpdated: (guest: Guest) => void;
}

export default function SendWhatsAppQueue({ open, onOpenChange, client, guests, onGuestUpdated }: Props) {
  const templateKey = `wa-template-${client._id}`;
  const [template, setTemplate] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_WA_TEMPLATE;
    return window.localStorage.getItem(templateKey) || DEFAULT_WA_TEMPLATE;
  });
  const [status, setStatus] = useState<Record<string, SendStatus>>(() => {
    const init: Record<string, SendStatus> = {};
    for (const g of guests) {
      init[g._id] = !normalizePhone(g.phone) ? 'skipped' : g.invitedAt ? 'sent' : 'pending';
    }
    return init;
  });

  const couple = `${client.groomName} & ${client.brideName}`;

  const messageFor = (g: Guest) =>
    buildWaMessage(template, {
      invitationName: g.invitationName,
      couple,
      link: invitationUrl(client.slug, g.slug),
    });

  const updateTemplate = (val: string) => {
    setTemplate(val);
    if (typeof window !== 'undefined') window.localStorage.setItem(templateKey, val);
  };

  const sentCount = useMemo(() => guests.filter((g) => status[g._id] === 'sent').length, [guests, status]);
  const nextPending = guests.find((g) => status[g._id] === 'pending');

  const sendOne = async (g: Guest) => {
    if (!normalizePhone(g.phone)) return;
    window.open(waLink(g.phone, messageFor(g)), '_blank');
    setStatus((s) => ({ ...s, [g._id]: 'sent' }));
    try {
      const { data } = await api.patch(`/guests/${g._id}/invited`, { invited: true });
      onGuestUpdated(data.guest);
    } catch {
      /* optimistic UI already updated */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send WhatsApp ({guests.length})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Message</p>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => updateTemplate(DEFAULT_WA_TEMPLATE)}>
                Reset
              </Button>
            </div>
            <textarea
              value={template}
              onChange={(e) => updateTemplate(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            />
            <p className="text-[11px] text-muted-foreground">
              Placeholders: <code>{'{invitationName}'}</code> <code>{'{couple}'}</code> <code>{'{link}'}</code>
            </p>
            {guests[0] && (
              <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">
                Preview: {messageFor(guests[0])}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{sentCount} / {guests.length} sent</p>
            <Button size="sm" disabled={!nextPending} onClick={() => nextPending && sendOne(nextPending)}>
              {nextPending ? 'Open next' : 'All done'}
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
            {guests.map((g) => {
              const st = status[g._id];
              const phone = normalizePhone(g.phone);
              return (
                <div key={g._id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{g.invitationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {phone ? `+${phone}` : <span className="text-destructive">no phone</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={st === 'sent' ? 'text-xs text-green-600' : st === 'skipped' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                      {st}
                    </span>
                    <Button size="sm" variant={st === 'sent' ? 'outline' : 'default'} disabled={!phone} onClick={() => sendOne(g)}>
                      {st === 'sent' ? 'Re-open' : 'Open'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
