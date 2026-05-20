'use client';

import { motion } from 'framer-motion';

interface HeroProps {
  groomName: string;
  brideName: string;
  eventDate: string;
  venue?: string;
  guestName?: string;
  heroTitle?: string;
  bodyGreeting?: string;
  heroPhoto?: string;
  regionStripe?: string;
  decorConfig?: unknown;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Hero({ groomName, brideName, eventDate, venue, guestName, heroTitle, bodyGreeting, heroPhoto, regionStripe }: HeroProps) {
  const handleScroll = () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section
      className="min-h-[100dvh] flex flex-col items-center justify-center px-5 sm:px-6 py-16 relative overflow-hidden"
      style={{ backgroundColor: 'var(--wedding-primary, #6B1020)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center max-w-lg w-full"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs uppercase tracking-[0.25em] mb-6"
          style={{ color: 'var(--wedding-accent, #C8A84B)' }}
        >
          {heroTitle || 'The Wedding of'}
        </motion.p>

        {heroPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mx-auto mb-6 overflow-hidden w-[180px] h-[210px] sm:w-[220px] sm:h-[260px]"
            style={{
              borderRadius: '50% 50% 12% 12% / 35% 35% 8% 8%',
              border: '3px solid var(--wedding-accent, #C8A84B)',
            }}
          >
            <img src={heroPhoto} alt={`${groomName} & ${brideName}`} className="w-full h-full object-cover" />
          </motion.div>
        )}

        {bodyGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 space-y-1"
          >
            {bodyGreeting.split('\n').map((line, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(245,237,224,0.75)' }}>
                {line}
              </p>
            ))}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="font-heading text-5xl sm:text-7xl md:text-8xl italic leading-none break-words mb-1"
          style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}
        >
          {groomName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="font-heading text-3xl italic my-1"
          style={{ color: 'var(--wedding-accent, #C8A84B)' }}
        >
          &amp;
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="font-heading text-5xl sm:text-7xl md:text-8xl italic leading-none break-words mb-8"
          style={{ color: 'var(--wedding-secondary, #F5EDE0)' }}
        >
          {brideName}
        </motion.h1>

        {eventDate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-sm"
            style={{ color: 'rgba(245,237,224,0.65)' }}
          >
            {formatDate(eventDate)}{venue ? ` · ${venue}` : ''}
          </motion.p>
        )}

        {guestName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-4 text-xs tracking-widest"
            style={{ color: 'rgba(245,237,224,0.5)' }}
          >
            Kepada Yth. {guestName}
          </motion.p>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        onClick={handleScroll}
        className="absolute bottom-10 text-xs tracking-widest hover:opacity-80 transition-opacity"
        style={{ color: 'rgba(245,237,224,0.45)' }}
      >
        Gulir ↓
      </motion.button>

      {regionStripe && (
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 4, background: regionStripe }}
        />
      )}
    </section>
  );
}
