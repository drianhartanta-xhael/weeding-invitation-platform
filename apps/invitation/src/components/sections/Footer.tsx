'use client';

import { motion } from 'framer-motion';
import type { DecorationConfig } from '@/lib/decorations/types';

interface FooterProps {
  groomName: string;
  brideName: string;
  decorConfig?: DecorationConfig;
}

export default function Footer({ groomName, brideName, decorConfig }: FooterProps) {
  return (
    <section className="py-16 px-4 bg-wedding-accent text-white text-center relative overflow-hidden">
      {decorConfig && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <decorConfig.FooterDecor colors={decorConfig.colors} />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <p className="text-sm uppercase tracking-widest mb-4 opacity-80">
          Thank You
        </p>
        <h2 className="font-heading text-3xl md:text-4xl mb-4">
          {groomName} & {brideName}
        </h2>
        <p className="opacity-70 text-sm">
          We are looking forward to celebrating with you
        </p>
      </motion.div>
    </section>
  );
}
