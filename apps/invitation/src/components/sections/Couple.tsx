'use client';

import { motion } from 'framer-motion';

interface CulturalQuote {
  ethnic: string;
  quote: string;
}

interface CoupleProps {
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
  culturalQuotes?: CulturalQuote[];
  layout?: string;
  heading?: string;
  centerPhoto?: string;
  bouquetImage?: string;
  ringsImage?: string;
  groomLabel?: string;
  brideLabel?: string;
}

const fade = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7 },
};

export default function Couple({
  groomName, brideName, groomPhoto, bridePhoto,
  groomParents, brideParents, culturalQuotes,
  layout, heading, centerPhoto, bouquetImage, ringsImage, groomLabel, brideLabel,
}: CoupleProps) {
  if (layout === 'split') {
    const accent = 'var(--wedding-accent, #ba6193)';
    const primary = 'var(--wedding-primary, #823460)';
    const subText = 'color-mix(in srgb, var(--wedding-primary, #823460) 80%, transparent)';
    const block = (name: string, lbl: string, p: { father: string; mother: string }, order: string) => (
      <motion.div {...fade} className={`text-center ${order}`}>
        <h3 className="font-heading text-3xl md:text-4xl italic mb-4" style={{ color: accent }}>{name}</h3>
        <p className="text-sm tracking-wide mb-3" style={{ color: primary }}>{lbl}</p>
        <p className="text-sm leading-relaxed" style={{ color: subText }}>
          {p.father}<br />and<br />{p.mother}
        </p>
      </motion.div>
    );
    return (
      <section className="py-20 px-5">
        <motion.div {...fade} className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-5xl italic" style={{ color: accent }}>
            {heading || 'The happy couple and parents'}
          </h2>
        </motion.div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-12 md:gap-6">
          {block(groomName, groomLabel || 'First son of', groomParents, 'md:order-1')}
          <motion.div {...fade} className="order-first md:order-2 flex justify-center">
            <div className="relative w-60 sm:w-72">
              <div
                className="aspect-square rounded-full overflow-hidden border-4"
                style={{ borderColor: 'color-mix(in srgb, var(--wedding-accent, #ba6193) 30%, transparent)' }}
              >
                {centerPhoto && <img src={centerPhoto} alt={`${groomName} & ${brideName}`} className="w-full h-full object-cover" />}
              </div>
              {bouquetImage && (
                <img src={bouquetImage} alt="" aria-hidden className="absolute -left-12 sm:-left-16 bottom-1 w-36 sm:w-44 object-contain pointer-events-none" />
              )}
              {ringsImage && (
                <img src={ringsImage} alt="" aria-hidden className="absolute -right-8 sm:-right-10 -bottom-6 w-28 sm:w-32 object-contain pointer-events-none" />
              )}
            </div>
          </motion.div>
          {block(brideName, brideLabel || 'First daughter of', brideParents, 'md:order-3')}
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <motion.div {...fade} className="text-center mb-16">
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Mempelai
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Dua Insan, Satu Jiwa
        </h2>
      </motion.div>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-center gap-6 mb-16">
        <motion.div {...fade} className="flex-1 text-center">
          <p className="text-xs tracking-[0.2em] uppercase mb-4 font-medium" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            Mempelai Pria
          </p>
          <div className="w-44 h-56 mx-auto mb-5 overflow-hidden rounded-lg bg-gray-100 border" style={{ borderColor: 'var(--wedding-accent, #C8A84B)' }}>
            {groomPhoto
              ? <img src={groomPhoto} alt={groomName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Foto</div>
            }
          </div>
          <h3 className="font-heading text-2xl italic mb-1" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
            {groomName}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(61,26,14,0.65)' }}>
            Putra dari{' '}
            <strong>{groomParents.father}</strong>{' '}
            &amp;{' '}
            <strong>{groomParents.mother}</strong>
          </p>
        </motion.div>

        <motion.div {...fade} className="self-center text-center py-4 md:py-12">
          <span className="font-heading text-5xl italic" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            &amp;
          </span>
        </motion.div>

        <motion.div {...fade} className="flex-1 text-center">
          <p className="text-xs tracking-[0.2em] uppercase mb-4 font-medium" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            Mempelai Wanita
          </p>
          <div className="w-44 h-56 mx-auto mb-5 overflow-hidden rounded-lg bg-gray-100 border" style={{ borderColor: 'var(--wedding-accent, #C8A84B)' }}>
            {bridePhoto
              ? <img src={bridePhoto} alt={brideName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Foto</div>
            }
          </div>
          <h3 className="font-heading text-2xl italic mb-1" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
            {brideName}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(61,26,14,0.65)' }}>
            Putri dari{' '}
            <strong>{brideParents.father}</strong>{' '}
            &amp;{' '}
            <strong>{brideParents.mother}</strong>
          </p>
        </motion.div>
      </div>

      {culturalQuotes && culturalQuotes.length > 0 && (
        <motion.div {...fade} className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {culturalQuotes.map((q, i) => (
              <div
                key={i}
                className="flex-1 min-w-[130px] max-w-[180px] text-center p-4 rounded-lg"
                style={{
                  border: '1px solid rgba(107,16,32,0.15)',
                  backgroundColor: 'rgba(200,168,75,0.05)',
                }}
              >
                <p className="text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {q.ethnic}
                </p>
                <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(61,26,14,0.65)' }}>
                  &ldquo;{q.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
