'use client';

import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const minangColors: DecorColors = {
  bg: '#1a0000',      // very dark red-black
  surface: '#2a0000',
  accent: '#c9920a',  // gold
  primary: '#c9920a', // gold on dark bg
  dark: '#1a0000',
};

// SongketDiamond — a filled diamond (rotated square) with inner decorative lines
function SongketDiamond({
  cx,
  cy,
  size,
  color,
  opacity,
}: {
  cx: number;
  cy: number;
  size: number;
  color: string;
  opacity: number;
}) {
  const s = size / 2;
  return (
    <g opacity={opacity}>
      <polygon
        points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
        fill={color}
      />
      <polygon
        points={`${cx},${cy - s * 0.6} ${cx + s * 0.6},${cy} ${cx},${cy + s * 0.6} ${cx - s * 0.6},${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

// GonjongRoof — the iconic pointed Minangkabau roof with upturned horns
function GonjongRoof({
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
  const w = width;
  const h = height;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      {/* Main triangular roof */}
      <polygon
        points={`${w * 0.1},${h} ${w * 0.5},${h * 0.3} ${w * 0.9},${h}`}
        fill={color}
      />
      {/* Left horn: curves up and to the left */}
      <path
        d={`M ${w * 0.1},${h} Q ${w * 0.05},${h * 0.5} ${0},${h * 0.2}`}
        fill="none"
        stroke={color}
        strokeWidth={h * 0.08}
        strokeLinecap="round"
      />
      {/* Right horn */}
      <path
        d={`M ${w * 0.9},${h} Q ${w * 0.95},${h * 0.5} ${w},${h * 0.2}`}
        fill="none"
        stroke={color}
        strokeWidth={h * 0.08}
        strokeLinecap="round"
      />
    </g>
  );
}

// HeroDecor: Gold SongketDiamond grid along top edge + GonjongRoof silhouettes at bottom
export function HeroDecor({ colors }: DecorProps) {
  const gold = colors.accent;

  // Top diamond grid: 2 rows, ~80px tall
  // Row 1: diamonds every ~40px starting at x=20, y=20
  // Row 2: offset diamonds every ~40px starting at x=40, y=50
  const diamondSize = 18;
  const cols = 26; // enough to span 1000px viewBox width
  const row1 = Array.from({ length: cols }, (_, i) => ({
    cx: 20 + i * 40,
    cy: 22,
  }));
  const row2 = Array.from({ length: cols }, (_, i) => ({
    cx: 40 + i * 40,
    cy: 52,
  }));

  // Bottom GonjongRoof silhouettes cityscape (very subtle)
  const roofCount = 7;
  const roofWidth = 120;
  const roofHeight = 70;
  const roofY = 530; // near bottom of 600px hero
  const roofs = Array.from({ length: roofCount }, (_, i) => ({
    x: i * 140 + 20,
    y: roofY,
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
      {/* Top diamond grid */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={80}
        viewBox="0 0 1000 80"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {row1.map((d, i) => (
          <SongketDiamond
            key={`r1-${i}`}
            cx={d.cx}
            cy={d.cy}
            size={diamondSize}
            color={gold}
            opacity={0.55}
          />
        ))}
        {row2.map((d, i) => (
          <SongketDiamond
            key={`r2-${i}`}
            cx={d.cx}
            cy={d.cy}
            size={diamondSize * 0.8}
            color={gold}
            opacity={0.35}
          />
        ))}
      </svg>

      {/* Bottom GonjongRoof silhouettes */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={120}
        viewBox={`0 0 1000 120`}
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      >
        {roofs.map((r, i) => (
          <GonjongRoof
            key={i}
            x={r.x}
            y={10}
            width={roofWidth}
            height={roofHeight}
            color={gold}
            opacity={0.1}
          />
        ))}
      </svg>
    </div>
  );
}

// SectionDecor: Songket diamond border strip on top and bottom (20px bands)
export function SectionDecor({
  colors,
  variant,
}: DecorProps & { variant: SectionVariant }) {
  const isDark = variant === 'dark';
  const diamondColor = isDark ? colors.accent : colors.primary;
  const opacity = 0.45;
  const bandHeight = 20;
  const diamondSize = 12;
  const cols = 52;

  const diamonds = Array.from({ length: cols }, (_, i) => ({
    cx: 10 + i * 20,
    cy: bandHeight / 2,
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
      {/* Top diamond strip */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={bandHeight}
        viewBox={`0 0 1000 ${bandHeight}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {diamonds.map((d, i) => (
          <SongketDiamond
            key={i}
            cx={d.cx}
            cy={d.cy}
            size={diamondSize}
            color={diamondColor}
            opacity={opacity}
          />
        ))}
      </svg>

      {/* Bottom diamond strip */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={bandHeight}
        viewBox={`0 0 1000 ${bandHeight}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      >
        {diamonds.map((d, i) => (
          <SongketDiamond
            key={i}
            cx={d.cx}
            cy={d.cy}
            size={diamondSize}
            color={diamondColor}
            opacity={opacity}
          />
        ))}
      </svg>
    </div>
  );
}

// FooterDecor: Row of 6 GonjongRoof silhouettes + SongketDiamond row above them
export function FooterDecor({ colors }: DecorProps) {
  const gold = colors.accent;

  const roofCount = 6;
  const roofWidth = 140;
  const roofHeight = 55;
  const spacing = 160;
  const startX = 20;

  const roofs = Array.from({ length: roofCount }, (_, i) => ({
    x: startX + i * spacing,
    y: 25,
  }));

  // Diamond row above the roofs
  const cols = 52;
  const diamonds = Array.from({ length: cols }, (_, i) => ({
    cx: 10 + i * 20,
    cy: 10,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 90,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={90}
        viewBox="0 0 1000 90"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Diamond row */}
        {diamonds.map((d, i) => (
          <SongketDiamond
            key={`fd-${i}`}
            cx={d.cx}
            cy={d.cy}
            size={10}
            color={gold}
            opacity={0.35}
          />
        ))}
        {/* Gonjong roofs */}
        {roofs.map((r, i) => (
          <GonjongRoof
            key={`fr-${i}`}
            x={r.x}
            y={r.y}
            width={roofWidth}
            height={roofHeight}
            color={gold}
            opacity={0.15}
          />
        ))}
      </svg>
    </div>
  );
}
