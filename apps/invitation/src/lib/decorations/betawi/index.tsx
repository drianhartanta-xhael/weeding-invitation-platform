'use client';

import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const betawiColors: DecorColors = {
  bg: '#fff8f0',      // warm white
  surface: '#fff0e0',
  accent: '#c9920a',  // gold
  primary: '#cc2200', // Betawi red
  dark: '#1a6600',    // deep green (for dark sections)
};

function PeonyFlower({
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
  const r = size / 2;
  // 8 petals arranged radially + center
  const petals = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 8;
    const px = cx + Math.cos(angle) * r * 0.55;
    const py = cy + Math.sin(angle) * r * 0.55;
    return (
      <ellipse
        key={i}
        cx={px}
        cy={py}
        rx={r * 0.42}
        ry={r * 0.28}
        transform={`rotate(${(i * 360) / 8}, ${px}, ${py})`}
        fill={color}
      />
    );
  });
  return (
    <g opacity={opacity}>
      {petals}
      <circle cx={cx} cy={cy} r={r * 0.3} fill={color} />
    </g>
  );
}

function OndelSilhouette({
  x,
  y,
  height,
  color,
  opacity,
}: {
  x: number;
  y: number;
  height: number;
  color: string;
  opacity: number;
}) {
  const h = height;
  const w = h * 0.45;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      {/* Big round head */}
      <circle cx={w / 2} cy={h * 0.18} r={h * 0.18} fill={color} />
      {/* Crown/headdress */}
      <polygon
        points={`${w * 0.2},${h * 0.05} ${w * 0.5},${-h * 0.08} ${w * 0.8},${h * 0.05}`}
        fill={color}
      />
      {/* Body */}
      <rect
        x={w * 0.1}
        y={h * 0.36}
        width={w * 0.8}
        height={h * 0.45}
        rx={w * 0.1}
        fill={color}
      />
      {/* Skirt/base flares out */}
      <polygon
        points={`${0},${h} ${w * 0.15},${h * 0.75} ${w * 0.85},${h * 0.75} ${w},${h}`}
        fill={color}
      />
    </g>
  );
}

// HeroDecor: Peony clusters in all 4 corners + Ondel-Ondel in bottom corners
export function HeroDecor({ colors }: DecorProps) {
  const red = colors.primary;
  const svgSize = 200;
  const ondelHeight = 80;
  const ondelW = ondelHeight * 0.45;

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
      {/* Top-left corner: peony cluster */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgSize}
        height={svgSize}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <PeonyFlower cx={30} cy={30} size={50} color={red} opacity={0.15} />
        <PeonyFlower cx={75} cy={20} size={38} color={red} opacity={0.12} />
        <PeonyFlower cx={20} cy={80} size={30} color={red} opacity={0.10} />
      </svg>

      {/* Top-right corner: peony cluster */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgSize}
        height={svgSize}
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        <PeonyFlower cx={170} cy={30} size={50} color={red} opacity={0.15} />
        <PeonyFlower cx={125} cy={20} size={38} color={red} opacity={0.12} />
        <PeonyFlower cx={180} cy={80} size={30} color={red} opacity={0.10} />
      </svg>

      {/* Bottom-left corner: peony cluster + Ondel-Ondel */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgSize}
        height={svgSize}
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      >
        <PeonyFlower cx={30} cy={170} size={50} color={red} opacity={0.15} />
        <PeonyFlower cx={75} cy={180} size={38} color={red} opacity={0.12} />
        <PeonyFlower cx={20} cy={120} size={30} color={red} opacity={0.10} />
        <OndelSilhouette
          x={svgSize - ondelW - 10}
          y={svgSize - ondelHeight}
          height={ondelHeight}
          color={red}
          opacity={0.12}
        />
      </svg>

      {/* Bottom-right corner: peony cluster + Ondel-Ondel */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgSize}
        height={svgSize}
        style={{ position: 'absolute', bottom: 0, right: 0 }}
      >
        <PeonyFlower cx={170} cy={170} size={50} color={red} opacity={0.15} />
        <PeonyFlower cx={125} cy={180} size={38} color={red} opacity={0.12} />
        <PeonyFlower cx={180} cy={120} size={30} color={red} opacity={0.10} />
        <OndelSilhouette
          x={10}
          y={svgSize - ondelHeight}
          height={ondelHeight}
          color={red}
          opacity={0.12}
        />
      </svg>
    </div>
  );
}

// SectionDecor: Row of Peony flowers along the top edge
export function SectionDecor({
  colors,
  variant,
}: DecorProps & { variant: SectionVariant }) {
  const isDark = variant === 'dark';
  const flowerColor = isDark ? '#fff8f0' : colors.primary;
  const flowerOpacity = 0.15;

  // 6 flowers spread evenly across the top
  const flowers: Array<{ cx: number; cy: number; size: number }> = [
    { cx: 80,  cy: 22, size: 36 },
    { cx: 220, cy: 16, size: 30 },
    { cx: 360, cy: 24, size: 40 },
    { cx: 500, cy: 14, size: 32 },
    { cx: 640, cy: 24, size: 38 },
    { cx: 780, cy: 16, size: 30 },
    { cx: 920, cy: 22, size: 34 },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={60}
        viewBox="0 0 1000 60"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {flowers.map((f, i) => (
          <PeonyFlower
            key={i}
            cx={f.cx}
            cy={f.cy}
            size={f.size}
            color={flowerColor}
            opacity={flowerOpacity}
          />
        ))}
      </svg>
    </div>
  );
}

// FooterDecor: Ondel-Ondel pair flanking the footer + gold peony row across top
export function FooterDecor({ colors }: DecorProps) {
  const gold = colors.accent;
  const red = colors.primary;
  const ondelHeight = 100;
  const ondelW = ondelHeight * 0.45;
  const svgH = 120;

  const flowers: Array<{ cx: number; cy: number; size: number }> = [
    { cx: 80,  cy: 20, size: 36 },
    { cx: 220, cy: 14, size: 30 },
    { cx: 360, cy: 22, size: 40 },
    { cx: 500, cy: 12, size: 32 },
    { cx: 640, cy: 22, size: 38 },
    { cx: 780, cy: 14, size: 30 },
    { cx: 920, cy: 20, size: 34 },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: svgH,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Gold peony row across the top */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={60}
        viewBox="0 0 1000 60"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {flowers.map((f, i) => (
          <PeonyFlower
            key={i}
            cx={f.cx}
            cy={f.cy}
            size={f.size}
            color={gold}
            opacity={0.20}
          />
        ))}
      </svg>

      {/* Left Ondel-Ondel */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={ondelW + 20}
        height={svgH}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <OndelSilhouette
          x={10}
          y={svgH - ondelHeight}
          height={ondelHeight}
          color={red}
          opacity={0.15}
        />
      </svg>

      {/* Right Ondel-Ondel */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={ondelW + 20}
        height={svgH}
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        <OndelSilhouette
          x={0}
          y={svgH - ondelHeight}
          height={ondelHeight}
          color={red}
          opacity={0.15}
        />
      </svg>
    </div>
  );
}
