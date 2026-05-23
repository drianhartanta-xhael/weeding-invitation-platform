'use client';

import { motion } from 'framer-motion';
import { useLightbox } from './useLightbox';

interface GalleryGridProps {
  images: string[];
  eyebrow?: string;
  heading?: string;
}

export default function GalleryGrid({ images, eyebrow, heading }: GalleryGridProps) {
  const { open, lightbox } = useLightbox(images);
  const count = images.length;

  const gridClass =
    count === 1
      ? 'grid grid-cols-1'
      : count === 2
      ? 'grid grid-cols-2'
      : 'grid grid-cols-2 md:grid-cols-3'; // 3 and 4+

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p
          className="text-xs tracking-[0.25em] uppercase mb-2"
          style={{ color: 'var(--wedding-primary, #6B1020)' }}
        >
          {eyebrow || 'Galeri'}
        </p>
        <h2
          className="font-heading text-3xl md:text-4xl italic"
          style={{ color: 'var(--wedding-primary, #6B1020)' }}
        >
          {heading || 'Momen Berharga'}
        </h2>
      </motion.div>

      <div className={`max-w-5xl mx-auto ${gridClass} gap-2.5`}>
        {images.map((image, i) => {
          const isHero = count >= 4 && i === 1;
          const aspectClass =
            count === 1 ? 'aspect-[16/9]' : isHero ? '' : 'aspect-[4/5]';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onClick={() => open(i)}
              className={`${aspectClass} rounded-lg overflow-hidden cursor-pointer hover:scale-[1.04] transition-transform`}
              style={isHero ? { gridRow: 'span 2' } : undefined}
            >
              <img
                src={image}
                alt={`Gallery ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
          );
        })}
      </div>

      {lightbox}
    </section>
  );
}
