'use client';

import { motion } from 'framer-motion';

interface HeroProps {
  groomName: string;
  brideName: string;
  eventDate: string;
  guestName?: string;
}

export default function Hero({ groomName, brideName, eventDate, guestName }: HeroProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-wedding-secondary relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center z-10 px-4"
      >
        {guestName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-500 mb-4"
          >
            Dear {guestName}, you are cordially invited
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm uppercase tracking-widest text-wedding-accent mb-6"
        >
          The Wedding of
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="font-heading text-5xl md:text-7xl text-wedding-accent mb-2"
        >
          {groomName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="font-heading text-2xl text-wedding-primary my-4"
        >
          &
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="font-heading text-5xl md:text-7xl text-wedding-accent mb-8"
        >
          {brideName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-gray-600"
        >
          {new Date(eventDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8"
      >
        <p className="text-sm text-gray-400 animate-bounce">Scroll Down</p>
      </motion.div>
    </section>
  );
}
