'use client';

import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const baliColors: DecorColors = {
  bg: '#1a0e00',      // deep navy/dark
  surface: '#2a1a00',
  accent: '#c9920a',  // gold
  primary: '#c9920a', // gold for headings on dark bg
  dark: '#1a0e00',
};

// Base Patra scroll primitive: a curling vine/scroll shape
function PatraScroll({
  x,
  y,
  size,
  color,
  opacity,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}) {
  const s = size;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <path
        d={`M 0,0 Q ${s * 0.3},${-s * 0.4} ${s * 0.6},0 Q ${s * 0.9},${s * 0.4} ${s * 0.6},${s * 0.6} Q ${s * 0.3},${s * 0.8} 0,${s * 0.5}`}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.06}
        strokeLinecap="round"
      />
      <circle cx={0} cy={0} r={size * 0.08} fill={color} />
    </g>
  );
}

// KoriGate — decorative arch silhouette (simplified Kori gate)
function KoriGate({
  x,
  y,
  width,
  height,
  color,
  opacity,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}) {
  const tier1w = width;
  const tier2w = width * 0.75;
  const tier3w = width * 0.5;
  const archH = height * 0.35;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      {/* Base tiers */}
      <rect x={(tier1w - tier1w) / 2} y={height - archH * 0.4} width={tier1w} height={archH * 0.4} fill={color} />
      <rect x={(tier1w - tier2w) / 2} y={height - archH * 0.7} width={tier2w} height={archH * 0.35} fill={color} />
      <rect x={(tier1w - tier3w) / 2} y={height - archH} width={tier3w} height={archH * 0.35} fill={color} />
      {/* Pointed arch */}
      <path
        d={`M ${tier1w * 0.15},${height - archH} L ${tier1w * 0.5},${0} L ${tier1w * 0.85},${height - archH} Z`}
        fill={color}
      />
    </g>
  );
}

// HeroDecor: Patra scrolls along top/bottom edges + subtle KoriGate corners
export function HeroDecor({ colors }: DecorProps) {
  const gold = colors.accent;

  // Top edge patra scrolls
  const topScrolls = [
    { x: 10,  y: 8,  size: 40, opacity: 0.22 },
    { x: 65,  y: 5,  size: 32, opacity: 0.18 },
    { x: 110, y: 10, size: 36, opacity: 0.20 },
    { x: 158, y: 4,  size: 28, opacity: 0.15 },
  ];

  // Bottom edge patra scrolls
  const bottomScrolls = [
    { x: 10,  y: 10, size: 40, opacity: 0.22 },
    { x: 68,  y: 5,  size: 32, opacity: 0.18 },
    { x: 118, y: 12, size: 36, opacity: 0.20 },
    { x: 162, y: 3,  size: 28, opacity: 0.15 },
  ];

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
      {/* Top-left patra strip + KoriGate corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={220}
        height={100}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {topScrolls.map((s, i) => (
          <PatraScroll key={i} x={s.x} y={s.y} size={s.size} color={gold} opacity={s.opacity} />
        ))}
        <KoriGate x={4} y={4} width={36} height={80} color={gold} opacity={0.08} />
      </svg>

      {/* Top-right patra strip + KoriGate corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={220}
        height={100}
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        {topScrolls.map((s, i) => (
          <PatraScroll
            key={i}
            x={210 - s.x - s.size * 0.6}
            y={s.y}
            size={s.size}
            color={gold}
            opacity={s.opacity}
          />
        ))}
        <KoriGate x={180} y={4} width={36} height={80} color={gold} opacity={0.08} />
      </svg>

      {/* Bottom-left patra strip + KoriGate corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={220}
        height={100}
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      >
        {bottomScrolls.map((s, i) => (
          <PatraScroll key={i} x={s.x} y={s.y} size={s.size} color={gold} opacity={s.opacity} />
        ))}
        <KoriGate x={4} y={4} width={36} height={80} color={gold} opacity={0.08} />
      </svg>

      {/* Bottom-right patra strip + KoriGate corner */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={220}
        height={100}
        style={{ position: 'absolute', bottom: 0, right: 0 }}
      >
        {bottomScrolls.map((s, i) => (
          <PatraScroll
            key={i}
            x={210 - s.x - s.size * 0.6}
            y={s.y}
            size={s.size}
            color={gold}
            opacity={s.opacity}
          />
        ))}
        <KoriGate x={180} y={4} width={36} height={80} color={gold} opacity={0.08} />
      </svg>
    </div>
  );
}

// SectionDecor: Patra scrolls along top/bottom (dark) or left/right (light/accent) edges
export function SectionDecor({
  colors,
  variant,
}: DecorProps & { variant: SectionVariant }) {
  const isDark = variant === 'dark';
  const motifColor = colors.accent;
  const baseOpacity = isDark ? 0.20 : 0.14;

  if (isDark) {
    // For dark: gold patra scrolls along top and bottom of section
    const scrollDefs = [
      { x: 10,  y: 6,  size: 38, opacity: baseOpacity },
      { x: 62,  y: 4,  size: 30, opacity: baseOpacity * 0.85 },
      { x: 106, y: 8,  size: 34, opacity: baseOpacity * 0.9 },
      { x: 152, y: 3,  size: 26, opacity: baseOpacity * 0.75 },
      { x: 192, y: 7,  size: 32, opacity: baseOpacity * 0.85 },
      { x: 238, y: 4,  size: 28, opacity: baseOpacity * 0.80 },
    ];

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
        {/* Top edge */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height={70}
          viewBox="0 0 280 70"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {scrollDefs.map((s, i) => (
            <PatraScroll key={i} x={s.x} y={s.y} size={s.size} color={motifColor} opacity={s.opacity} />
          ))}
        </svg>
        {/* Bottom edge */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height={70}
          viewBox="0 0 280 70"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', bottom: 0, left: 0 }}
        >
          {scrollDefs.map((s, i) => (
            <PatraScroll key={i} x={s.x} y={s.y} size={s.size} color={motifColor} opacity={s.opacity} />
          ))}
        </svg>
      </div>
    );
  }

  // For light/accent: dark patra scrolls along left and right edges
  const stripWidth = 60;
  const rows = 8;
  const rowHeight = 56;
  const totalHeight = rows * rowHeight;

  const motifs = Array.from({ length: rows }, (_, i) => ({
    x: 4,
    y: rowHeight * i + 8,
    size: i % 2 === 0 ? 36 : 28,
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
          <PatraScroll key={i} x={m.x} y={m.y} size={m.size} color={motifColor} opacity={m.opacity} />
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
          <PatraScroll key={i} x={m.x} y={m.y} size={m.size} color={motifColor} opacity={m.opacity} />
        ))}
      </svg>
    </div>
  );
}

// FooterDecor: Row of KoriGate silhouettes across the top + Patra vines between them
export function FooterDecor({ colors }: DecorProps) {
  const gold = colors.accent;

  // KoriGate positions spread across the footer top band
  const gates: Array<{ x: number; y: number; w: number; h: number; opacity: number }> = [
    { x: 20,  y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 120, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 220, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 320, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 420, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 520, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 620, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 720, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 820, y: 4,  w: 44, h: 60, opacity: 0.18 },
    { x: 920, y: 4,  w: 44, h: 60, opacity: 0.18 },
  ];

  // Patra scrolls between gates
  const vines: Array<{ x: number; y: number; size: number; opacity: number }> = [
    { x: 68,  y: 30, size: 28, opacity: 0.15 },
    { x: 168, y: 28, size: 26, opacity: 0.14 },
    { x: 268, y: 30, size: 28, opacity: 0.15 },
    { x: 368, y: 28, size: 26, opacity: 0.14 },
    { x: 468, y: 30, size: 28, opacity: 0.15 },
    { x: 568, y: 28, size: 26, opacity: 0.14 },
    { x: 668, y: 30, size: 28, opacity: 0.15 },
    { x: 768, y: 28, size: 26, opacity: 0.14 },
    { x: 868, y: 30, size: 28, opacity: 0.15 },
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
        {gates.map((g, i) => (
          <KoriGate key={i} x={g.x} y={g.y} width={g.w} height={g.h} color={gold} opacity={g.opacity} />
        ))}
        {vines.map((v, i) => (
          <PatraScroll key={i} x={v.x} y={v.y} size={v.size} color={gold} opacity={v.opacity} />
        ))}
      </svg>
    </div>
  );
}
