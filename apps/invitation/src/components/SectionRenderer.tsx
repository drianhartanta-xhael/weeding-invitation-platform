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
import AccentMotif from './AccentMotif';
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
  const SectionDivider = decorConfig?.SectionDivider;

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
                layout={section.data.layout}
                heading={section.data.heading}
                centerPhoto={section.data.centerPhoto}
                bouquetImage={section.data.bouquetImage}
                ringsImage={section.data.ringsImage}
                groomLabel={section.data.groomLabel}
                brideLabel={section.data.brideLabel}
              />
            );
            break;

          case 'event-detail':
            content = (
              <Events
                events={section.data.events || []}
                eyebrow={section.data.eyebrow}
                heading={section.data.heading}
                text={section.data.text}
                dateLocale={section.data.dateLocale}
              />
            );
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
                bankOnly={section.data.bankOnly}
                text={section.data.text}
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
                  text={section.data.text}
                />
              );
            }
            break;

          case 'wishes':
            content = <Wishes clientId={clientId} initialWishes={[]} text={section.data.text} />;
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
                accentImage={section.data.accentImage}
                backgroundImage={section.data.backgroundImage}
                heading={section.data.heading}
                buttonLabel={section.data.buttonLabel}
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
            {SectionDecor && decorConfig && !section.data?.noDecor && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <SectionDecor colors={decorConfig.colors} variant={variant} />
              </div>
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {section.data?.accentMotif && <AccentMotif name={section.data.accentMotif} />}
              {content}
              {SectionDivider && !section.data?.noDecor && <SectionDivider colors={decorConfig!.colors} />}
            </div>
          </div>
        );
      })}
    </>
  );
}
