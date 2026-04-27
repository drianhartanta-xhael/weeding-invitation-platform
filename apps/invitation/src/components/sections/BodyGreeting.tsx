'use client';

import { motion } from 'framer-motion';

interface BodyGreetingProps {
  text: string;
}

export default function BodyGreeting({ text }: BodyGreetingProps) {
  if (!text) return null;

  return (
    <section className="py-12 px-4 bg-wedding-secondary text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto"
      >
        <p className="font-heading text-lg md:text-xl text-wedding-accent leading-relaxed whitespace-pre-line">
          {text}
        </p>
      </motion.div>
    </section>
  );
}
