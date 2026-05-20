'use client';

import type { CSSProperties } from 'react';
import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const floralColors: DecorColors = {
  bg: '#F7F3EE',
  surface: '#FFFFFF',
  accent: '#C9477E',
  primary: '#C9477E',
  dark: '#F0E3DC',
};

// Internal palette — flowers/leaves use more than one accent colour.
const BLOOM = '#E59BB6';
const BLOOM_ALT = '#E7C46B';
const LEAF = '#9FB484';

// A single 5-petal bloom centred at (0,0).
function Bloom({ size, color = BLOOM }: { size: number; color?: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx={0}
          cy={-size * 0.55}
          rx={size * 0.3}
          ry={size * 0.55}
          fill={color}
          transform={`rotate(${deg})`}
        />
      ))}
      <circle r={size * 0.28} fill={BLOOM_ALT} />
    </g>
  );
}

// A leafy sprig: a curved stem with three leaves and a bloom at the tip.
function Sprig({ size }: { size: number }) {
  const s = size;
  return (
    <g>
      <path
        d={`M 0,0 Q ${s * 0.4},${-s * 0.4} ${s * 0.2},${-s}`}
        fill="none"
        stroke={LEAF}
        strokeWidth={s * 0.06}
        strokeLinecap="round"
      />
      {[0.25, 0.5, 0.75].map((t, i) => (
        <ellipse
          key={i}
          cx={s * 0.3}
          cy={-s * t}
          rx={s * 0.22}
          ry={s * 0.1}
          fill={LEAF}
          transform={`rotate(${i % 2 === 0 ? 35 : -35} ${s * 0.3} ${-s * t})`}
        />
      ))}
      <g transform={`translate(${s * 0.2}, ${-s})`}>
        <Bloom size={s * 0.4} />
      </g>
    </g>
  );
}

// A horizontal strip of alternating blooms + sprigs, used along section edges.
function FloralStrip({ width, flip }: { width: number; flip?: boolean }) {
  const items = Array.from({ length: Math.ceil(width / 90) + 1 }, (_, i) => i);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height={70}
      viewBox={`0 0 ${width} 70`}
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', transform: flip ? 'scaleY(-1)' : undefined }}
    >
      {items.map((i) => (
        <g key={i} transform={`translate(${i * 90 + 30}, 56)`} opacity={0.5}>
          {i % 2 === 0 ? <Sprig size={44} /> : <g transform="translate(0,-18)"><Bloom size={26} /></g>}
        </g>
      ))}
    </svg>
  );
}

// HeroDecor — large sprig clusters in the four corners.
// On mobile the corners are scaled down so they don't overlap the centered content.
export function HeroDecor(_props: DecorProps) {
  const corner = (style: CSSProperties, extra: string) => (
    <div
      className="absolute w-[90px] h-[90px] sm:w-[150px] sm:h-[150px]"
      style={{ ...style }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 150 150"
        style={{ transform: extra }}
      >
        <g transform="translate(40,140)" opacity={0.55}>
          <Sprig size={90} />
          <g transform="translate(60,-10)"><Sprig size={60} /></g>
        </g>
      </svg>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {corner({ top: 0, left: 0 }, 'none')}
      {corner({ top: 0, right: 0 }, 'scaleX(-1)')}
      {corner({ bottom: 0, left: 0 }, 'scaleY(-1)')}
      {corner({ bottom: 0, right: 0 }, 'scale(-1,-1)')}
    </div>
  );
}

// SectionDecor — floral strips along the top and bottom edges of every section.
export function SectionDecor(_props: DecorProps & { variant: SectionVariant }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <FloralStrip width={900} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <FloralStrip width={900} flip />
      </div>
    </div>
  );
}

// FooterDecor — a single floral strip across the top of the footer.
export function FooterDecor(_props: DecorProps) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 70, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <FloralStrip width={1000} />
    </div>
  );
}
