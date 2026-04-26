'use client';

import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const batakColors: DecorColors = {
  bg: '#f5f0e8',      // cream/krem
  surface: '#ede5d5',
  accent: '#cc0000',  // Batak red
  primary: '#1a1a1a', // dark/black
  dark: '#1a1a1a',
};

// GorgaZigzag — horizontal zigzag band (sarisari pattern)
function GorgaZigzag({
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
  // Generate zigzag path across the width
  const step = height * 1.5;
  const points: string[] = [];
  let px = x;
  let up = true;
  while (px <= x + width + step) {
    points.push(`${px},${up ? y : y + height}`);
    px += step / 2;
    up = !up;
  }
  // Close as filled polygon band
  const topPath = points.join(' ');
  return (
    <polyline
      points={topPath}
      fill="none"
      stroke={color}
      strokeWidth={height * 0.5}
      strokeLinecap="square"
      opacity={opacity}
    />
  );
}

// GorgaSpiral — simplified Singa (lion) spiral/whorl motif using concentric arcs
function GorgaSpiral({
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
  // Approximated spiral using concentric arcs
  return (
    <g opacity={opacity}>
      <path
        d={`M ${cx},${cy - r * 0.3} A ${r * 0.3},${r * 0.3} 0 1 1 ${cx + 0.01},${cy - r * 0.3}`}
        fill="none" stroke={color} strokeWidth={size * 0.07}
      />
      <path
        d={`M ${cx},${cy - r * 0.6} A ${r * 0.6},${r * 0.6} 0 1 1 ${cx + 0.01},${cy - r * 0.6}`}
        fill="none" stroke={color} strokeWidth={size * 0.05}
      />
      <circle cx={cx} cy={cy} r={size * 0.08} fill={color} />
    </g>
  );
}

// HeroDecor: Two zigzag bands at top + GorgaSpiral motifs in all 4 corners
export function HeroDecor({ colors }: DecorProps) {
  const svgWidth = 200;
  const svgHeight = 200;
  const zigzagH = 20;
  const spiralSize = 30;

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
      {/* Top zigzag bands — full width */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={zigzagH * 2 + 4}
        viewBox={`0 0 1000 ${zigzagH * 2 + 4}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Red band */}
        <GorgaZigzag
          x={0}
          y={2}
          width={1000}
          height={zigzagH}
          color={colors.accent}
          opacity={0.7}
        />
        {/* Black band */}
        <GorgaZigzag
          x={0}
          y={zigzagH + 2}
          width={1000}
          height={zigzagH}
          color={colors.primary}
          opacity={0.3}
        />
      </svg>

      {/* Top-left corner spirals */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <GorgaSpiral cx={30} cy={80} size={spiralSize} color={colors.accent} opacity={0.6} />
        <GorgaSpiral cx={65} cy={110} size={spiralSize * 0.85} color={colors.primary} opacity={0.25} />
        <GorgaSpiral cx={30} cy={140} size={spiralSize * 0.7} color={colors.accent} opacity={0.4} />
      </svg>

      {/* Top-right corner spirals */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        <GorgaSpiral cx={170} cy={80} size={spiralSize} color={colors.accent} opacity={0.6} />
        <GorgaSpiral cx={135} cy={110} size={spiralSize * 0.85} color={colors.primary} opacity={0.25} />
        <GorgaSpiral cx={170} cy={140} size={spiralSize * 0.7} color={colors.accent} opacity={0.4} />
      </svg>

      {/* Bottom-left corner spirals */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      >
        <GorgaSpiral cx={30} cy={120} size={spiralSize} color={colors.accent} opacity={0.6} />
        <GorgaSpiral cx={65} cy={90} size={spiralSize * 0.85} color={colors.primary} opacity={0.25} />
        <GorgaSpiral cx={30} cy={60} size={spiralSize * 0.7} color={colors.accent} opacity={0.4} />
      </svg>

      {/* Bottom-right corner spirals */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        style={{ position: 'absolute', bottom: 0, right: 0 }}
      >
        <GorgaSpiral cx={170} cy={120} size={spiralSize} color={colors.accent} opacity={0.6} />
        <GorgaSpiral cx={135} cy={90} size={spiralSize * 0.85} color={colors.primary} opacity={0.25} />
        <GorgaSpiral cx={170} cy={60} size={spiralSize * 0.7} color={colors.accent} opacity={0.4} />
      </svg>
    </div>
  );
}

// SectionDecor: Top and bottom zigzag bands for every section
export function SectionDecor({
  colors,
  variant,
}: DecorProps & { variant: SectionVariant }) {
  const isDark = variant === 'dark';
  // For dark: cream zigzags; for light/accent: red + black
  const bandColorA = isDark ? colors.bg : colors.accent;
  const bandColorB = isDark ? colors.bg : colors.primary;
  const opacityA = isDark ? 0.5 : 0.65;
  const opacityB = isDark ? 0.3 : 0.25;
  const bandH = 15;

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
      {/* Top bands */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={bandH * 2 + 4}
        viewBox={`0 0 1000 ${bandH * 2 + 4}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <GorgaZigzag x={0} y={2} width={1000} height={bandH} color={bandColorA} opacity={opacityA} />
        <GorgaZigzag x={0} y={bandH + 2} width={1000} height={bandH} color={bandColorB} opacity={opacityB} />
      </svg>

      {/* Bottom bands */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={bandH * 2 + 4}
        viewBox={`0 0 1000 ${bandH * 2 + 4}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      >
        <GorgaZigzag x={0} y={2} width={1000} height={bandH} color={bandColorB} opacity={opacityB} />
        <GorgaZigzag x={0} y={bandH + 2} width={1000} height={bandH} color={bandColorA} opacity={opacityA} />
      </svg>
    </div>
  );
}

// FooterDecor: Three stacked GorgaZigzag bands at top + row of GorgaSpiral motifs
export function FooterDecor({ colors }: DecorProps) {
  const bandH = 15;
  const totalBandH = bandH * 3 + 8;
  const spiralY = totalBandH + 22;
  const spiralSize = 28;

  // Evenly-spaced spirals across 1000-wide viewBox
  const spiralPositions = [60, 160, 260, 360, 460, 560, 660, 760, 860, 940];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: spiralY + spiralSize + 10,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height={spiralY + spiralSize + 10}
        viewBox={`0 0 1000 ${spiralY + spiralSize + 10}`}
        preserveAspectRatio="xMidYMin slice"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Three zigzag bands: red, black, red */}
        <GorgaZigzag x={0} y={2} width={1000} height={bandH} color={colors.accent} opacity={0.7} />
        <GorgaZigzag x={0} y={bandH + 4} width={1000} height={bandH} color={colors.primary} opacity={0.3} />
        <GorgaZigzag x={0} y={bandH * 2 + 6} width={1000} height={bandH} color={colors.accent} opacity={0.55} />

        {/* Row of GorgaSpiral motifs centered below zigzag bands */}
        {spiralPositions.map((spx, i) => (
          <GorgaSpiral
            key={i}
            cx={spx}
            cy={spiralY}
            size={i % 3 === 0 ? spiralSize : spiralSize * 0.8}
            color={i % 2 === 0 ? colors.accent : colors.primary}
            opacity={i % 2 === 0 ? 0.55 : 0.25}
          />
        ))}
      </svg>
    </div>
  );
}
