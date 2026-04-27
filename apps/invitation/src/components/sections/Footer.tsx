'use client';

import { motion } from 'framer-motion';

interface FooterProps {
  groomName: string;
  brideName: string;
  footerTitle?: string;
  footerMessage?: string;
}

export default function Footer({ groomName, brideName, footerTitle, footerMessage }: FooterProps) {
  const title = footerTitle || 'Thank You';
  const message = footerMessage || 'We are looking forward to celebrating with you';

  return (
    <section className="py-16 px-4 bg-wedding-accent text-white text-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <p className="text-sm uppercase tracking-widest mb-4 opacity-80">
          {title}
        </p>
        <h2 className="font-heading text-3xl md:text-4xl mb-4">
          {groomName} & {brideName}
        </h2>
        <p className="opacity-70 text-sm">
          {message}
        </p>
      </motion.div>
    </section>
  );
}
