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
}: CoupleProps) {
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

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-center gap-6 mb-16">
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
