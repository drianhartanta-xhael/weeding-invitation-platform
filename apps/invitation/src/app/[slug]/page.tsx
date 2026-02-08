'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Hero from '@/components/sections/Hero';
import Couple from '@/components/sections/Couple';
import Events from '@/components/sections/Events';
import Countdown from '@/components/sections/Countdown';
import Gallery from '@/components/sections/Gallery';
import RSVP from '@/components/sections/RSVP';
import Wishes from '@/components/sections/Wishes';
import Gift from '@/components/sections/Gift';
import Footer from '@/components/sections/Footer';
import MusicPlayer from '@/components/sections/MusicPlayer';

interface InvitationData {
  _id: string;
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
  eventDate: string;
  events: {
    name: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  }[];
  slug: string;
  music: { url: string; autoplay: boolean };
  bankAccounts: { bank: string; accountNumber: string; accountName: string }[];
  gallery?: string[];
}

interface GuestData {
  _id: string;
  invitationName: string;
  slug: string;
  rsvpStatus: string;
}

interface WishData {
  _id: string;
  guestName: string;
  message: string;
  createdAt: string;
}

export default function InvitationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const slug = params.slug as string;
  const guestSlug = searchParams.get('to');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = guestSlug
          ? `/invitations/${slug}/${guestSlug}`
          : `/invitations/${slug}`;

        const { data } = await api.get(endpoint);
        setInvitation(data.invitation);
        setGuest(data.guest || null);
        setWishes(data.wishes || []);
      } catch (err) {
        setError('Invitation not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, guestSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wedding-secondary">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-wedding-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wedding-secondary">
        <div className="text-center">
          <h1 className="text-2xl font-heading text-wedding-accent mb-2">
            Invitation Not Found
          </h1>
          <p className="text-gray-500">
            Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main>
      <MusicPlayer
        url={invitation.music.url}
        autoplay={invitation.music.autoplay}
      />

      <Hero
        groomName={invitation.groomName}
        brideName={invitation.brideName}
        eventDate={invitation.eventDate}
        guestName={guest?.invitationName}
      />

      <Couple
        groomName={invitation.groomName}
        brideName={invitation.brideName}
        groomPhoto={invitation.groomPhoto}
        bridePhoto={invitation.bridePhoto}
        groomParents={invitation.groomParents}
        brideParents={invitation.brideParents}
      />

      <Events events={invitation.events} />

      <Countdown eventDate={invitation.eventDate} />

      <Gallery images={invitation.gallery || []} />

      {guest && (
        <RSVP
          clientSlug={invitation.slug}
          guestSlug={guest.slug}
          currentStatus={guest.rsvpStatus}
        />
      )}

      <Wishes clientId={invitation._id} initialWishes={wishes} />

      <Gift
        clientId={invitation._id}
        bankAccounts={invitation.bankAccounts}
      />

      <Footer
        groomName={invitation.groomName}
        brideName={invitation.brideName}
      />
    </main>
  );
}
