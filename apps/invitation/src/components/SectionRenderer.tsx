'use client';

import type { DecorationConfig, SectionVariant } from '@/lib/decorations/types';

interface Section {
  _id?: string;
  componentId: string;
  style?: string;
  props?: Record<string, unknown>;
}

interface SectionRendererProps {
  sections: Section[];
  decorConfig?: DecorationConfig;
}

export default function SectionRenderer({ sections, decorConfig }: SectionRendererProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <>
      {sections.map((section, index) => {
        const variant = (section.style as SectionVariant) ?? 'light';
        return (
          <div key={section._id ?? index} style={{ position: 'relative', overflow: 'hidden' }}>
            {decorConfig && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <decorConfig.SectionDecor colors={decorConfig.colors} variant={variant} />
              </div>
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Section content rendered here by slot system */}
              {section.componentId}
            </div>
          </div>
        );
      })}
    </>
  );
}
