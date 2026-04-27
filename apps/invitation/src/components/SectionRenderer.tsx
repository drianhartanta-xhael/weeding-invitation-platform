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
  // Context data passed through for components that need it
  clientId: string;
  clientSlug: string;
  guestSlug?: string;
  guestRsvpStatus?: string;
}

export default function SectionRenderer({
  sections,
  stylePresets,
  clientId,
  clientSlug,
  guestSlug,
  guestRsvpStatus,
}: SectionRendererProps) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((section) => {
        const preset = stylePresets[section.style] || { bg: '#FEFAE0', text: '#333333' };

        const wrapperStyle = {
          backgroundColor: preset.bg,
          color: preset.text,
        };

        let content: React.ReactNode = null;

        switch (section.componentId) {
          case 'couple-profile':
            content = (
              <Couple
                groomName={section.data.groomName || ''}
                brideName={section.data.brideName || ''}
                groomPhoto={section.data.groomPhoto || ''}
                bridePhoto={section.data.bridePhoto || ''}
                groomParents={section.data.groomParents || { father: '', mother: '' }}
                brideParents={section.data.brideParents || { father: '', mother: '' }}
              />
            );
            break;

          case 'event-detail':
            content = <Events events={section.data.events || []} />;
            break;

          case 'gallery':
            content = <Gallery images={section.data.images || []} />;
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

          default:
            content = null;
        }

        if (!content) return null;

        return (
          <div key={section.id} style={wrapperStyle}>
            {content}
          </div>
        );
      })}
    </>
  );
}
