'use client';

import { useState, useEffect, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UseLightboxResult {
  open: (idx: number) => void;
  lightbox: ReactElement;
}

export function useLightbox(images: string[]): UseLightboxResult {
  const [idx, setIdx] = useState<number | null>(null);

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIdx(null);
      else if (e.key === 'ArrowRight') {
        setIdx((i) => (i === null ? null : (i + 1) % images.length));
      } else if (e.key === 'ArrowLeft') {
        setIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, images.length]);

  const lightbox: ReactElement = (
    <AnimatePresence>
      {idx !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIdx(null)}
        >
          <motion.img
            key={idx}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            src={images[idx]}
            alt="Gallery"
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { open: setIdx, lightbox };
}
