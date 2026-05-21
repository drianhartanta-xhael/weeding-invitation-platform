'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import Hero from '@/components/sections/Hero';
import HeroLight from '@/components/sections/HeroLight';
import BodyGreeting from '@/components/sections/BodyGreeting';
import Couple from '@/components/sections/Couple';
import Events from '@/components/sections/Events';
import Countdown from '@/components/sections/Countdown';
import Gallery from '@/components/sections/Gallery';
import RSVP from '@/components/sections/RSVP';
import Wishes from '@/components/sections/Wishes';
import Gift from '@/components/sections/Gift';
import Footer from '@/components/sections/Footer';
import MusicPlayer from '@/components/sections/MusicPlayer';
import SectionRenderer from '@/components/SectionRenderer';
import Cover from '@/components/Cover';
import { DECORATION_REGISTRY } from '@/lib/decorations/registry';
import { REGION_STRIPES } from '@/lib/regionStripes';

interface TemplateConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  heroVariant?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  bodyGreeting?: string;
  footerTitle?: string;
  footerMessage?: string;
  regionKey?: string;
  regionLabel?: string;
}

interface CustomContent {
  heroTitle?: string;
  heroSubtitle?: string;
  bodyGreeting?: string;
  footerTitle?: string;
  footerMessage?: string;
  heroPhoto?: string;
  heroAccent?: string;
  footerImage?: string;
}

interface SectionData {
  id: string;
  componentId: string;
  data: Record<string, any>;
  style: string;
  order: number;
}

interface InvitationData {
  _id: string;
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
  eventDate: string;
  venue?: string;
  events: {
    name: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  }[];
  slug: string;
  music: {
    videoId?: string;
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    url?: string;
    autoplay: boolean;
  };
  bankAccounts: { bank: string; accountNumber: string; accountName: string }[];
  gallery?: string[];
  customContent?: CustomContent;
  sections?: SectionData[];
  templateId?: {
    config: TemplateConfig;
    stylePresets?: Record<string, { bg: string; text: string }>;
    decorationStyle?: string;
  } | null;
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
  const [isOpen, setIsOpen] = useState(false);

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

        // Apply template theme
        const config = data.invitation?.templateId?.config;
        if (config) {
          const root = document.documentElement;
          root.style.setProperty('--wedding-primary', config.primaryColor);
          root.style.setProperty('--wedding-secondary', config.secondaryColor);
          root.style.setProperty('--wedding-accent', config.accentColor);

          // Dynamic font loading
          const families = [config.fontHeading, config.fontBody]
            .filter(Boolean)
            .map((f: string) => f.replace(/ /g, '+'))
            .join('&family=');

          if (families) {
            const linkId = 'dynamic-template-fonts';
            if (!document.getElementById(linkId)) {
              const link = document.createElement('link');
              link.id = linkId;
              link.rel = 'stylesheet';
              link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@300;400;700&display=swap`;
              document.head.appendChild(link);
            }
            root.style.setProperty('--font-heading', `'${config.fontHeading}'`);
            root.style.setProperty('--font-body', `'${config.fontBody}'`);
          }
        }
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
          <h1 className="text-2xl font-heading text-wedding-accent mb-2">Invitation Not Found</h1>
          <p className="text-gray-500">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  // ===== DUAL-MODE RENDERING =====
  const hasSections = invitation.sections && invitation.sections.length > 0;
  const templateConfig = (invitation.templateId as { config: TemplateConfig; stylePresets?: Record<string, { bg: string; text: string }>; decorationStyle?: string } | null);
  const cc = invitation.customContent;

  // Resolve content for legacy mode: client > template > hardcoded
  const heroTitle = cc?.heroTitle || templateConfig?.config?.heroTitle || 'The Wedding of';
  const heroSubtitle = cc?.heroSubtitle || templateConfig?.config?.heroSubtitle || 'you are cordially invited';
  const bodyGreeting = cc?.bodyGreeting || templateConfig?.config?.bodyGreeting || '';
  const footerTitle = cc?.footerTitle || templateConfig?.config?.footerTitle || 'Thank You';
  const footerMessage = cc?.footerMessage || templateConfig?.config?.footerMessage || '';
  const heroPhoto = cc?.heroPhoto || '';
  const heroVariant = templateConfig?.config?.heroVariant;

  const defaultStylePresets = {
    light: { bg: '#FEFAE0', text: '#333333' },
    dark: { bg: '#2D2D2D', text: '#FFFFFF' },
    accent: { bg: '#606C38', text: '#FFFFFF' },
    'image-1': { bg: '#F5F0EB', text: '#333333' },
    'image-2': { bg: '#E8E0D8', text: '#333333' },
  };

  const decorationStyle = templateConfig?.decorationStyle;
  const decorConfig = DECORATION_REGISTRY[decorationStyle ?? 'none'] ?? DECORATION_REGISTRY['none'];

  const regionKey = templateConfig?.config?.regionKey;
  const regionStripe = regionKey ? REGION_STRIPES[regionKey] : undefined;
  const regionLabel = templateConfig?.config?.regionLabel;

  return (
    <main style={decorConfig.colors.bg !== '#FEFAE0' ? { backgroundColor: decorConfig.colors.bg } : undefined}>
      <MusicPlayer
        videoId={invitation.music.videoId}
        title={invitation.music.title}
        artist={invitation.music.artist}
        thumbnailUrl={invitation.music.thumbnailUrl}
        url={invitation.music.url}
        autoplay={invitation.music.autoplay}
        shouldPlay={isOpen}
      />

      {hasSections ? (
        // ===== NEW SLOT-BASED RENDERING =====
        (() => {
          const coverSection = invitation.sections!.find(s => s.componentId === 'cover');
          const contentSections = invitation.sections!.filter(s => s.componentId !== 'cover');
          return (
            <>
              <AnimatePresence>
                {coverSection && !isOpen && (
                  <Cover
                    key="cover-overlay"
                    groomName={invitation.groomName}
                    brideName={invitation.brideName}
                    guestName={guest?.invitationName}
                    coverText={coverSection.data.coverText}
                    coverImage={coverSection.data.coverImage}
                    inviteText={coverSection.data.inviteText}
                    openText={coverSection.data.openText}
                    bg={templateConfig?.stylePresets?.['dark']?.bg}
                    accent={templateConfig?.config?.accentColor}
                    textColor={templateConfig?.stylePresets?.['dark']?.text}
                    HeroDecor={decorConfig.HeroDecor}
                    decorColors={decorConfig.colors}
                    onOpen={() => setIsOpen(true)}
                  />
                )}
              </AnimatePresence>

              {heroVariant === 'light' ? (
                <HeroLight
                  groomName={invitation.groomName}
                  brideName={invitation.brideName}
                  eventDate={invitation.eventDate}
                  venue={invitation.venue || invitation.events?.[0]?.venue}
                  guestName={guest?.invitationName}
                  heroPhoto={heroPhoto}
                  baseImage={cc?.heroAccent}
                />
              ) : (
                <Hero
                  groomName={invitation.groomName}
                  brideName={invitation.brideName}
                  eventDate={invitation.eventDate}
                  venue={invitation.events?.[0]?.venue}
                  guestName={guest?.invitationName}
                  heroTitle={heroTitle}
                  bodyGreeting={bodyGreeting}
                  heroPhoto={heroPhoto}
                  regionStripe={regionStripe}
                  decorConfig={decorConfig}
                />
              )}

              <SectionRenderer
                sections={contentSections}
                stylePresets={templateConfig?.stylePresets || defaultStylePresets}
                clientId={invitation._id}
                clientSlug={invitation.slug}
                guestSlug={guest?.slug}
                guestRsvpStatus={guest?.rsvpStatus}
                decorConfig={decorConfig}
              />

              <Footer
                groomName={invitation.groomName}
                brideName={invitation.brideName}
                eventDate={invitation.eventDate}
                footerTitle={footerTitle}
                footerMessage={footerMessage}
                regionStripe={regionStripe}
                regionLabel={regionLabel}
                decorConfig={decorConfig}
                light={heroVariant === 'light'}
                illustration={cc?.footerImage}
              />
            </>
          );
        })()
      ) : (
        // ===== LEGACY RENDERING (backward compatible) =====
        <>
          <Hero
            groomName={invitation.groomName}
            brideName={invitation.brideName}
            eventDate={invitation.eventDate}
            guestName={guest?.invitationName}
            heroTitle={heroTitle}
          />

          <BodyGreeting text={bodyGreeting} />

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

          <Gift clientId={invitation._id} bankAccounts={invitation.bankAccounts} />

          <Footer
            groomName={invitation.groomName}
            brideName={invitation.brideName}
            footerTitle={footerTitle}
            footerMessage={footerMessage}
          />
        </>
      )}
    </main>
  );
}
