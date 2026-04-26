'use client';

import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const jawaColors: DecorColors = {
  bg: '#f5ede0',      // cream
  surface: '#f5ede0',
  accent: '#c8a96e',  // gold
  primary: '#3d2b1f', // sogan brown (for text/headings)
  dark: '#3d2b1f',
};

// A single Kawung motif: 4 ovals arranged in a cross pattern around a center point
function KawungUnit({
  cx,
  cy,
  s,
  color,
  opacity,
}: {
  cx: number;
  cy: number;
  s: number;
  color: string;
  opacity: number;
}) {
  const rx = s * 0.38;
  const ry = s * 0.22;
  return (
    <g opacity={opacity}>
      <ellipse cx={cx} cy={cy - s * 0.3} rx={rx} ry={ry} fill={color} />
      <ellipse cx={cx} cy={cy + s * 0.3} rx={rx} ry={ry} fill={color} />
      <ellipse cx={cx - s * 0.3} cy={cy} rx={ry} ry={rx} fill={color} />
      <ellipse cx={cx + s * 0.3} cy={cy} rx={ry} ry={rx} fill={color} />
      <circle cx={cx} cy={cy} r={s * 0.12} fill={color} />
    </g>
  );
}

// HeroDecor: SVG corner decorations with 2–3 Kawung motifs per corner
export function HeroDecor({ colors }: DecorProps) {
  const gold = colors.accent;
  const size = 200;
  const s = 54; // unit size for motifs

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Top-left corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <KawungUnit cx={20} cy={20} s={s} color={gold} opacity={0.2} />
        <KawungUnit cx={80} cy={30} s={s * 0.8} color={gold} opacity={0.18} />
        <KawungUnit cx={30} cy={85} s={s * 0.7} color={gold} opacity={0.15} />
      </svg>

      {/* Top-right corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        <KawungUnit cx={180} cy={20} s={s} color={gold} opacity={0.2} />
        <KawungUnit cx={120} cy={30} s={s * 0.8} color={gold} opacity={0.18} />
        <KawungUnit cx={170} cy={85} s={s * 0.7} color={gold} opacity={0.15} />
      </svg>

      {/* Bottom-left corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      >
        <KawungUnit cx={20} cy={180} s={s} color={gold} opacity={0.2} />
        <KawungUnit cx={80} cy={170} s={s * 0.8} color={gold} opacity={0.18} />
        <KawungUnit cx={30} cy={115} s={s * 0.7} color={gold} opacity={0.15} />
      </svg>

      {/* Bottom-right corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        style={{ position: 'absolute', bottom: 0, right: 0 }}
      >
        <KawungUnit cx={180} cy={180} s={s} color={gold} opacity={0.2} />
        <KawungUnit cx={120} cy={170} s={s * 0.8} color={gold} opacity={0.18} />
        <KawungUnit cx={170} cy={115} s={s * 0.7} color={gold} opacity={0.15} />
      </svg>
    </div>
  );
}

// SectionDecor: Repeating kawung tile border on left and right edges
export function SectionDecor({
  colors,
  variant,
}: DecorProps & { variant: SectionVariant }) {
  const isDark = variant === 'dark';
  const motifColor = isDark ? '#ffffff' : colors.accent;
  const baseOpacity = isDark ? 0.12 : 0.13;

  const stripWidth = 60;
  const unitSize = 44;
  const rows = 8;
  const rowHeight = 56;
  const totalHeight = rows * rowHeight;

  const motifs = Array.from({ length: rows }, (_, i) => ({
    cx: stripWidth / 2,
    cy: rowHeight * i + rowHeight / 2,
    s: i % 2 === 0 ? unitSize : unitSize * 0.8,
    opacity: i % 3 === 0 ? baseOpacity : baseOpacity * 0.85,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Left strip */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={stripWidth}
        height={totalHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {motifs.map((m, i) => (
          <KawungUnit
            key={i}
            cx={m.cx}
            cy={m.cy}
            s={m.s}
            color={motifColor}
            opacity={m.opacity}
          />
        ))}
      </svg>

      {/* Right strip */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={stripWidth}
        height={totalHeight}
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        {motifs.map((m, i) => (
          <KawungUnit
            key={i}
            cx={m.cx}
            cy={m.cy}
            s={m.s}
            color={motifColor}
            opacity={m.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

// FooterDecor: Dense kawung motifs scattered across the top of the footer area
export function FooterDecor({ colors }: DecorProps) {
  const gold = colors.accent;

  // Spread motifs in a full-width decorative band at the top
  const motifs: Array<{ cx: number; cy: number; s: number; opacity: number }> = [
    { cx: 20,  cy: 24, s: 50, opacity: 0.2  },
    { cx: 90,  cy: 16, s: 40, opacity: 0.16 },
    { cx: 160, cy: 28, s: 46, opacity: 0.18 },
    { cx: 230, cy: 14, s: 38, opacity: 0.15 },
    { cx: 300, cy: 30, s: 52, opacity: 0.2  },
    { cx: 370, cy: 12, s: 36, opacity: 0.14 },
    { cx: 440, cy: 26, s: 48, opacity: 0.18 },
    { cx: 510, cy: 16, s: 42, opacity: 0.16 },
    { cx: 580, cy: 30, s: 50, opacity: 0.2  },
    { cx: 650, cy: 14, s: 38, opacity: 0.15 },
    { cx: 720, cy: 28, s: 46, opacity: 0.18 },
    { cx: 790, cy: 18, s: 40, opacity: 0.16 },
    { cx: 860, cy: 24, s: 50, opacity: 0.2  },
    { cx: 930, cy: 14, s: 36, opacity: 0.14 },
    { cx: 980, cy: 28, s: 44, opacity: 0.17 },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={80}
        viewBox="0 0 1000 80"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {motifs.map((m, i) => (
          <KawungUnit
            key={i}
            cx={m.cx}
            cy={m.cy}
            s={m.s}
            color={gold}
            opacity={m.opacity}
          />
        ))}
      </svg>
    </div>
  );
}
