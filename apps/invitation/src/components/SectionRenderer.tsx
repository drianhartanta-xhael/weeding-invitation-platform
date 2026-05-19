'use client';

import Couple from './sections/Couple';
import Events from './sections/Events';
import Gallery from './sections/Gallery';
import Countdown from './sections/Countdown';
import RSVP from './sections/RSVP';
import Wishes from './sections/Wishes';
import Gift from './sections/Gift';
import Story from './sections/Story';
import LocationMap from './sections/LocationMap';
import DressCode from './sections/DressCode';
import type { DecorationConfig, SectionVariant } from '@/lib/decorations/types';

interface SectionData {
  id: string;
  componentId: string;
  data: Record<string, any>;
  style: string;
  order: number;
}

interface StylePreset {
  bg: string;
  text: string;
}

interface SectionRendererProps {
  sections: SectionData[];
  stylePresets: Record<string, StylePreset>;
  clientId: string;
  clientSlug: string;
  guestSlug?: string;
  guestRsvpStatus?: string;
  decorConfig?: DecorationConfig;
}

const VALID_VARIANTS = new Set<string>(['light', 'dark', 'accent', 'image-1', 'image-2']);

export default function SectionRenderer({
  sections,
  stylePresets,
  clientId,
  clientSlug,
  guestSlug,
  guestRsvpStatus,
  decorConfig,
}: SectionRendererProps) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const SectionDecor = decorConfig?.SectionDecor;

  return (
    <>
      {sorted.map((section) => {
        const preset = stylePresets[section.style] || { bg: '#FEFAE0', text: '#333333' };
        const variant: SectionVariant = VALID_VARIANTS.has(section.style) ? section.style as SectionVariant : 'light';

        const wrapperStyle = {
          backgroundColor: preset.bg,
          color: preset.text,
        };

        let content: React.ReactNode = null;

        switch (section.componentId) {
          case 'cover':
            content = null;
            break;

          case 'couple-profile':
            content = (
              <Couple
                groomName={section.data.groomName || ''}
                brideName={section.data.brideName || ''}
                groomPhoto={section.data.groomPhoto || ''}
                bridePhoto={section.data.bridePhoto || ''}
                groomParents={section.data.groomParents || { father: '', mother: '' }}
                brideParents={section.data.brideParents || { father: '', mother: '' }}
                culturalQuotes={section.data.culturalQuotes}
              />
            );
            break;

          case 'event-detail':
            content = <Events events={section.data.events || []} />;
            break;

          case 'gallery':
            content = (
              <Gallery
                images={section.data.images || []}
                layout={section.data.layout}
              />
            );
            break;

          case 'donation':
            content = (
              <Gift
                clientId={clientId}
                bankAccounts={section.data.bankAccounts || []}
              />
            );
            break;

          case 'rsvp':
            if (guestSlug) {
              content = (
                <RSVP
                  clientSlug={clientSlug}
                  guestSlug={guestSlug}
                  currentStatus={guestRsvpStatus || 'pending'}
                />
              );
            }
            break;

          case 'wishes':
            content = <Wishes clientId={clientId} initialWishes={[]} />;
            break;

          case 'countdown':
            content = <Countdown eventDate={section.data.eventDate || ''} />;
            break;

          case 'story':
            content = <Story stories={section.data.stories || []} layout={section.data.layout || 'vertical'} />;
            break;

          case 'location-map':
            content = (
              <LocationMap
                venue={section.data.venue || ''}
                address={section.data.address || ''}
                mapUrl={section.data.mapUrl || ''}
              />
            );
            break;

          case 'dress-code':
            content = (
              <DressCode
                note={section.data.note}
                groups={section.data.groups || []}
              />
            );
            break;

          default:
            content = null;
        }

        if (!content) return null;

        return (
          <div key={section.id} style={{ ...wrapperStyle, position: 'relative', overflow: 'hidden' }}>
            {SectionDecor && decorConfig && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <SectionDecor colors={decorConfig.colors} variant={variant} />
              </div>
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {content}
            </div>
          </div>
        );
      })}
    </>
  );
}
