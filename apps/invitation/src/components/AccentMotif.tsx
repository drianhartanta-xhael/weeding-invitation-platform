'use client';

import type { FC } from 'react';

// Small decorative SVG motifs placed at the top of a section.
// Selected per-section via section.data.accentMotif.

function Rings() {
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="11" stroke="var(--wedding-accent, #D98FA8)" strokeWidth="3" />
      <circle cx="30" cy="18" r="11" stroke="var(--wedding-primary, #C9477E)" strokeWidth="3" />
    </svg>
  );
}

function Hearts() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" aria-hidden>
      <path
        d="M20 28 C 6 18, 8 6, 20 12 C 32 6, 34 18, 20 28 Z"
        fill="var(--wedding-primary, #C9477E)"
      />
    </svg>
  );
}

function Sprig() {
  return (
    <svg width="60" height="28" viewBox="0 0 60 28" aria-hidden>
      <path d="M4 14 H56" stroke="var(--wedding-accent, #D98FA8)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="14" r="6" fill="var(--wedding-primary, #C9477E)" />
      <circle cx="14" cy="14" r="3" fill="var(--wedding-accent, #D98FA8)" />
      <circle cx="46" cy="14" r="3" fill="var(--wedding-accent, #D98FA8)" />
    </svg>
  );
}

function Bloom() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <g transform="translate(18,18)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="0" cy="-9" rx="5" ry="9" fill="var(--wedding-accent, #D98FA8)" transform={`rotate(${deg})`} />
        ))}
        <circle r="5" fill="var(--wedding-primary, #C9477E)" />
      </g>
    </svg>
  );
}

const MOTIFS: Record<string, FC> = {
  rings: Rings,
  hearts: Hearts,
  sprig: Sprig,
  bloom: Bloom,
};

export default function AccentMotif({ name }: { name: string }) {
  const Motif = MOTIFS[name];
  if (!Motif) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 28 }}>
      <Motif />
    </div>
  );
}
