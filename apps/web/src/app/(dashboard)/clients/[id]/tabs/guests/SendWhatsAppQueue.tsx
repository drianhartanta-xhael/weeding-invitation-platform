'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import type { Client, Guest } from '../../types';
import { DEFAULT_WA_TEMPLATE, buildWaMessage, invitationUrl, normalizePhone, waLink } from '../../helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SendStatus = 'pending' | 'opened' | 'sent' | 'skipped';

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
  const [status, setStatus] = useState<Record<string, SendStatus>>({});
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const couple = `${client.groomName} & ${client.brideName}`;
  const guestIdsKey = guests.map((g) => g._id).join(',');

  // (Re)initialise statuses whenever the dialog opens or the selection changes.
  // invitedAt persists server-side, so reopening resumes where you left off.
  useEffect(() => {
    if (!open) return;
    const init: Record<string, SendStatus> = {};
    for (const g of guests) {
      init[g._id] = !normalizePhone(g.phone) ? 'skipped' : g.invitedAt ? 'sent' : 'pending';
    }
    setStatus(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guestIdsKey]);

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
  const openedGuest = guests.find((g) => status[g._id] === 'opened');
  const nextPending = guests.find((g) => status[g._id] === 'pending');

  const markSent = async (g: Guest) => {
    setStatus((s) => ({ ...s, [g._id]: 'sent' }));
    try {
      const { data } = await api.patch(`/guests/${g._id}/invited`, { invited: true });
      onGuestUpdated(data.guest);
    } catch {
      /* optimistic UI already updated */
    }
  };

  const openOne = (g: Guest) => {
    if (!normalizePhone(g.phone)) return;
    window.open(waLink(g.phone, messageFor(g)), '_blank');
    setStatus((s) => ({ ...s, [g._id]: 'opened' }));
  };

  // Primary queue action: confirm the currently-opened guest as sent, then open the next pending one.
  // Each tap therefore means "I sent that one — open the next".
  const advance = async () => {
    if (openedGuest) await markSent(openedGuest);
    if (nextPending) openOne(nextPending);
  };

  const copyMessage = (g: Guest) => {
    navigator.clipboard.writeText(messageFor(g));
  };

  const advanceLabel = nextPending
    ? openedGuest
      ? `✓ Sent — open ${nextPending.invitationName}`
      : `Open WhatsApp for ${nextPending.invitationName}`
    : openedGuest
      ? `✓ Mark ${openedGuest.invitationName} sent & finish`
      : 'All done';

  const sampleLink = guests[0] ? invitationUrl(client.slug, guests[0].slug) : '';
  const isLocalhost = sampleLink.includes('localhost');

  const visibleGuests = showOnlyPending
    ? guests.filter((g) => status[g._id] === 'pending' || status[g._id] === 'opened')
    : guests;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send WhatsApp ({guests.length})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLocalhost && (
            <div className="rounded-md border border-amber-500/50 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
              ⚠ Links point to <code>localhost</code>. Set <code>NEXT_PUBLIC_INVITATION_URL</code> to the live domain before sending, or guests get dead links.
            </div>
          )}

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

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{sentCount} / {guests.length} sent</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowOnlyPending((v) => !v)}>
                {showOnlyPending ? 'Show all' : 'Show only pending'}
              </Button>
              <Button size="sm" disabled={!openedGuest && !nextPending} onClick={advance}>
                {advanceLabel}
              </Button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
            {visibleGuests.map((g) => {
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
                  <div className="flex items-center gap-1.5">
                    <span
                      className={
                        st === 'sent'
                          ? 'text-xs text-green-600'
                          : st === 'opened'
                            ? 'text-xs text-amber-600'
                            : st === 'skipped'
                              ? 'text-xs text-destructive'
                              : 'text-xs text-muted-foreground'
                      }
                    >
                      {st}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={!phone} onClick={() => copyMessage(g)} title="Copy message">
                      Copy
                    </Button>
                    {st !== 'sent' && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-600" disabled={!phone} onClick={() => markSent(g)}>
                        ✓ Sent
                      </Button>
                    )}
                    <Button size="sm" variant={st === 'sent' ? 'outline' : 'default'} className="h-7 px-2 text-xs" disabled={!phone} onClick={() => openOne(g)}>
                      {st === 'sent' || st === 'opened' ? 'Re-open' : 'Open'}
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
