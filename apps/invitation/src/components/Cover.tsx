'use client';

import { motion } from 'framer-motion';

interface CoverProps {
  groomName: string;
  brideName: string;
  guestName?: string;
  coverText?: string;
  bg?: string;
  onOpen: () => void;
}

export default function Cover({ groomName, brideName, guestName, coverText, bg = '#6B1020', onOpen }: CoverProps) {
  const label = coverText || 'Kepada Yth.';
  const g0 = groomName.trim()[0]?.toUpperCase() || 'B';
  const b0 = brideName.trim()[0]?.toUpperCase() || 'S';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
      style={{ backgroundColor: bg, cursor: 'pointer' }}
      onClick={onOpen}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: '#C8A84B' }}>
          {label}
        </p>
        <p className="text-sm mb-10" style={{ color: 'rgba(245,237,224,0.85)' }}>
          {guestName || 'Tamu Undangan'}
        </p>

        {/* Envelope */}
        <div
          className="relative w-72 h-48 rounded-xl flex flex-col items-center justify-center mb-10"
          style={{
            backgroundColor: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(200,168,75,0.25)',
          }}
        >
          {/* Envelope V-flap top */}
          <div
            className="absolute top-0 left-0 right-0 h-24 overflow-hidden"
            style={{ borderRadius: '12px 12px 0 0' }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '144px solid transparent',
                borderRight: '144px solid transparent',
                borderTop: '96px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          {/* Heart seal */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 z-10"
            style={{ backgroundColor: '#C8A84B' }}
          >
            <span className="text-2xl" style={{ color: '#6B1020' }}>♥</span>
          </div>

          {/* Monogram */}
          <p className="font-heading text-xl italic z-10" style={{ color: '#C8A84B' }}>
            {g0} &amp; {b0}
          </p>
        </div>

        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs tracking-widest"
          style={{ color: 'rgba(245,237,224,0.5)' }}
        >
          Sentuh untuk membuka undangan
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
