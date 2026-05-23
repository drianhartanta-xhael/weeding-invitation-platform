'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import type { DecorColors } from '@/lib/decorations/types';

interface CoverProps {
  groomName: string;
  brideName: string;
  guestName?: string;
  coverText?: string;
  bg?: string;
  accent?: string;
  textColor?: string;
  HeroDecor?: FC<{ colors: DecorColors }>;
  decorColors?: DecorColors;
  coverImage?: string;
  backgroundImage?: string;
  inviteText?: string;
  openText?: string;
  onOpen: () => void;
}

export default function Cover({
  groomName,
  brideName,
  guestName,
  coverText,
  bg = '#6B1020',
  accent = '#C8A84B',
  textColor = 'rgba(245,237,224,0.85)',
  HeroDecor,
  decorColors,
  coverImage,
  backgroundImage,
  inviteText,
  openText,
  onOpen,
}: CoverProps) {
  const label = coverText || 'Kepada Yth.';
  const g0 = groomName.trim()[0]?.toUpperCase() || 'B';
  const b0 = brideName.trim()[0]?.toUpperCase() || 'S';

  if (coverImage) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden px-6"
        style={{ backgroundColor: bg, cursor: 'pointer' }}
        onClick={onOpen}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.6 }}
      >
        {backgroundImage && (
          <div
            aria-hidden
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${bg}cc, ${bg}cc), url('${backgroundImage}')`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center relative z-10 max-w-lg w-full"
        >
          <p className="text-sm sm:text-base mb-6" style={{ color: accent }}>
            {inviteText || 'You are cordially invited to celebrate the day of'}
          </p>
          <h1 className="font-heading italic text-5xl sm:text-7xl leading-[0.95] mb-8 break-words" style={{ color: accent }}>
            {groomName} and {brideName}
          </h1>
          <img src={coverImage} alt="" aria-hidden className="w-56 sm:w-72 h-auto object-contain mb-8" />
          <motion.p
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm sm:text-base"
            style={{ color: accent }}
          >
            {openText || 'Click to open the invitation.'}
          </motion.p>
          {guestName && (
            <p className="mt-4 text-xs tracking-widest" style={{ color: textColor }}>
              Kepada Yth. {guestName}
            </p>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden px-5"
      style={{ backgroundColor: bg, cursor: 'pointer' }}
      onClick={onOpen}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
    >
      {HeroDecor && decorColors && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <HeroDecor colors={decorColors} />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center relative z-10"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: accent }}>
          {label}
        </p>
        <p className="text-sm mb-10" style={{ color: textColor }}>
          {guestName || 'Tamu Undangan'}
        </p>

        {/* Envelope */}
        <div
          className="relative w-full max-w-[18rem] h-44 sm:h-48 rounded-xl flex flex-col items-center justify-center mb-10"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
          }}
        >
          {/* Heart seal */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 z-10"
            style={{ backgroundColor: accent }}
          >
            <span className="text-2xl" style={{ color: bg }}>♥</span>
          </div>

          {/* Monogram */}
          <p className="font-heading text-xl italic z-10" style={{ color: accent }}>
            {g0} &amp; {b0}
          </p>
        </div>

        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs tracking-widest"
          style={{ color: textColor }}
        >
          Sentuh untuk membuka undangan
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
