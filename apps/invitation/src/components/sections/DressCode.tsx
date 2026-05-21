'use client';

import { motion } from 'framer-motion';

interface DressGroup {
  label: string;
  description: string;
  figure?: string;
  image?: string;
}

interface DressCodeProps {
  note?: string;
  groups: DressGroup[];
}

// Flat-vector silhouette of a standing man.
function GentlemenFigure({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 150" fill={color} aria-hidden>
      <circle cx="40" cy="15" r="13" />
      <rect x="25" y="30" width="30" height="54" rx="8" />
      <rect x="30" y="80" width="9" height="62" rx="3" />
      <rect x="41" y="80" width="9" height="62" rx="3" />
    </svg>
  );
}

// Flat-vector silhouette of a standing woman in a dress.
function LadiesFigure({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 150" fill={color} aria-hidden>
      <circle cx="40" cy="15" r="13" />
      <path d="M40 28 L64 142 H16 Z" />
      <rect x="36" y="138" width="3" height="8" />
      <rect x="42" y="138" width="3" height="8" />
    </svg>
  );
}

export default function DressCode({ note, groups }: DressCodeProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <section className="py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="font-heading text-4xl md:text-5xl italic" style={{ color: 'var(--wedding-primary, #C9477E)' }}>
          Dress Code
        </h2>
        {note && <p className="mt-3 text-sm max-w-md mx-auto opacity-80">{note}</p>}
      </motion.div>

      <div className="max-w-2xl mx-auto grid gap-10 sm:grid-cols-2">
        {groups.map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="flex flex-col items-center text-center"
          >
            {g.image ? (
              <div className="w-full max-w-[300px] mb-3">
                <img src={g.image} alt={g.label} className="w-full h-auto object-contain" />
              </div>
            ) : (
              <div className="w-28 h-40 flex items-end justify-center mb-3">
                {g.figure === 'ladies' ? (
                  <LadiesFigure color="var(--wedding-accent, #D98FA8)" />
                ) : (
                  <GentlemenFigure color="var(--wedding-accent, #D98FA8)" />
                )}
              </div>
            )}
            <p className="font-medium text-lg" style={{ color: 'var(--wedding-primary, #C9477E)' }}>
              {g.label}
            </p>
            <p className="text-sm opacity-75 mt-0.5">{g.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
