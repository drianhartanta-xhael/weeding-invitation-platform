'use client';

import { useState } from 'react';
import type { Client, EventItem } from '../types';
import { EMPTY_EVENT } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  client: Client;
  saving: boolean;
  saveClient: (payload: Record<string, unknown>) => Promise<void>;
}

export default function EventsTab({ client, saving, saveClient }: Props) {
  const [events, setEvents] = useState<EventItem[]>(client.events || []);
  const [newEvent, setNewEvent] = useState<EventItem>({ ...EMPTY_EVENT });
  const [showAddEvent, setShowAddEvent] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Events</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowAddEvent(!showAddEvent)}>
          {showAddEvent ? 'Cancel' : '+ Add Event'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddEvent && (
          <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Event Name</Label>
                <Input placeholder="e.g. Akad Nikah" value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input placeholder="e.g. 08:00 - 10:00 WIB" value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Venue</Label>
                <Input placeholder="e.g. Masjid Al-Ikhlas" value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input value={newEvent.address}
                  onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Maps URL (optional)</Label>
                <Input placeholder="https://maps.google.com/..." value={newEvent.mapUrl}
                  onChange={(e) => setNewEvent({ ...newEvent, mapUrl: e.target.value })} />
              </div>
            </div>
            <Button size="sm" onClick={() => {
              if (!newEvent.name || !newEvent.date) return;
              setEvents([...events, { ...newEvent }]);
              setNewEvent({ ...EMPTY_EVENT });
              setShowAddEvent(false);
            }}>
              Add Event
            </Button>
          </div>
        )}

        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((ev, i) => (
              <div key={i} className="flex items-start justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{ev.name}</p>
                  <p className="text-sm text-muted-foreground">{ev.date} · {ev.time}</p>
                  <p className="text-sm text-muted-foreground">{ev.venue}</p>
                  {ev.address && <p className="text-xs text-muted-foreground">{ev.address}</p>}
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                  onClick={() => setEvents(events.filter((_, idx) => idx !== i))}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button disabled={saving} onClick={() => saveClient({ events })}>
          {saving ? 'Saving...' : 'Save Events'}
        </Button>
      </CardContent>
    </Card>
  );
}
