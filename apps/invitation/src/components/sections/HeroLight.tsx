'use client';

import { motion } from 'framer-motion';

interface HeroLightProps {
  groomName: string;
  brideName: string;
  eventDate: string;
  venue?: string;
  guestName?: string;
  heroPhoto?: string;
  baseImage?: string;
}

function formatDateEn(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '', date: dateStr };
  const day = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const date = `${d.getDate()} ${month} ${d.getFullYear()}`;
  return { day, date };
}

// A small decorative swash, drawn in the accent colour.
function Flourish() {
  return (
    <svg
      width="84"
      height="14"
      viewBox="0 0 84 14"
      fill="none"
      aria-hidden
      className="mx-auto mt-3"
      style={{ color: 'var(--wedding-accent, #ba6193)' }}
    >
      <path
        d="M2 8 C 18 1, 28 13, 42 7 C 56 1, 66 12, 82 5"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HeroLight({
  groomName,
  brideName,
  eventDate,
  venue,
  guestName,
  heroPhoto,
  baseImage,
}: HeroLightProps) {
  const { day, date } = formatDateEn(eventDate);
  const handleScroll = () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section
      className="min-h-[100dvh] flex flex-col items-center justify-center px-5 sm:px-8 py-16 relative overflow-hidden"
      style={{ backgroundColor: 'var(--wedding-secondary, #f5f3eb)' }}
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative z-20 font-heading italic text-center leading-[0.95] text-5xl sm:text-7xl md:text-8xl mb-10 sm:mb-14 break-words"
        style={{ color: 'var(--wedding-accent, #ba6193)' }}
      >
        {groomName} and {brideName}
      </motion.h1>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 items-center gap-8 md:gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center md:text-right order-2 md:order-1"
          style={{ color: 'var(--wedding-primary, #823460)' }}
        >
          <p className="text-sm sm:text-base tracking-[0.15em] font-medium leading-relaxed">
            {day}
            {day && ','}
            <br />
            {date}
          </p>
          <Flourish />
        </motion.div>

        {heroPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.9 }}
            className="order-1 md:order-2 flex justify-center"
          >
            <div className="relative w-60 sm:w-72 md:w-full max-w-sm">
              {baseImage && (
                <>
                  {/* bottom-left cluster, mirrored, in front of the couple */}
                  <img
                    src={baseImage}
                    alt=""
                    aria-hidden
                    className="absolute bottom-[-2%] left-0 w-[52%] max-w-none object-contain pointer-events-none z-20"
                    style={{ transform: 'translateX(-30%) translateY(25px) scaleX(-1)' }}
                  />
                  {/* bottom-right cluster, in front of the couple */}
                  <img
                    src={baseImage}
                    alt=""
                    aria-hidden
                    className="absolute bottom-[-2%] right-0 w-[52%] max-w-none object-contain pointer-events-none z-20"
                    style={{ transform: 'translateX(30%) translateY(25px)' }}
                  />
                </>
              )}
              <img
                src={heroPhoto}
                alt={`${groomName} & ${brideName}`}
                className="relative z-10 w-full object-contain"
              />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center md:text-left order-3"
          style={{ color: 'var(--wedding-primary, #823460)' }}
        >
          <p className="text-sm sm:text-base tracking-[0.15em] font-medium leading-relaxed uppercase">
            {venue}
          </p>
          <Flourish />
        </motion.div>
      </div>

      {guestName && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-xs tracking-widest text-center"
          style={{ color: 'color-mix(in srgb, var(--wedding-primary, #823460) 65%, transparent)' }}
        >
          Kepada Yth. {guestName}
        </motion.p>
      )}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={handleScroll}
        className="absolute bottom-8 text-xs tracking-widest hover:opacity-70 transition-opacity"
        style={{ color: 'color-mix(in srgb, var(--wedding-primary, #823460) 55%, transparent)' }}
      >
        Gulir ↓
      </motion.button>
    </section>
  );
}
