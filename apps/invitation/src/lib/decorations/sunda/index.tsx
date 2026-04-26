'use client';

import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const sundaColors: DecorColors = {
  bg: '#f0ead8',
  surface: '#e8dfc8',
  accent: '#8b6914',
  primary: '#2d4a1e',
  dark: '#2d4a1e',
};

// AnyamanStrip: renders a woven bamboo (anyaman) diagonal crossing lines pattern
// within a rectangle defined by width x height
function AnyamanStrip({
  width,
  height,
  color,
  opacity,
  spacing = 10,
}: {
  width: number | string;
  height: number;
  color: string;
  opacity: number;
  spacing?: number;
}) {
  // We generate lines in a fixed viewBox and let the SVG scale
  const vbW = 300;
  const vbH = height;

  const lines: React.ReactElement[] = [];

  // Diagonal lines going top-left to bottom-right (\ direction)
  for (let x = -vbH; x < vbW + vbH; x += spacing) {
    lines.push(
      <line
        key={`d1-${x}`}
        x1={x}
        y1={0}
        x2={x + vbH}
        y2={vbH}
        stroke={color}
        strokeWidth={1}
      />
    );
  }

  // Diagonal lines going top-right to bottom-left (/ direction)
  for (let x = -vbH; x < vbW + vbH; x += spacing) {
    lines.push(
      <line
        key={`d2-${x}`}
        x1={x}
        y1={vbH}
        x2={x + vbH}
        y2={0}
        stroke={color}
        strokeWidth={1}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid slice"
      opacity={opacity}
      style={{ display: 'block' }}
    >
      {lines}
    </svg>
  );
}

// AnyamanCorner: renders a small woven bamboo cluster in a fixed 40x40 square
function AnyamanCorner({ color, opacity }: { color: string; opacity: number }) {
  const size = 40;
  const spacing = 8;
  const lines: React.ReactElement[] = [];

  for (let x = -size; x < size * 2; x += spacing) {
    lines.push(
      <line
        key={`c1-${x}`}
        x1={x}
        y1={0}
        x2={x + size}
        y2={size}
        stroke={color}
        strokeWidth={1}
      />
    );
    lines.push(
      <line
        key={`c2-${x}`}
        x1={x}
        y1={size}
        x2={x + size}
        y2={0}
        stroke={color}
        strokeWidth={1}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      opacity={opacity}
      style={{ display: 'block' }}
    >
      {lines}
    </svg>
  );
}

// HeroDecor: 30px-wide border strips on all 4 edges filled with anyaman weave
export function HeroDecor({ colors }: DecorProps) {
  const color = colors.accent;
  const stripSize = 30;

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
      {/* Top strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: stripSize }}>
        <AnyamanStrip width="100%" height={stripSize} color={color} opacity={0.2} spacing={10} />
      </div>

      {/* Bottom strip */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: stripSize }}>
        <AnyamanStrip width="100%" height={stripSize} color={color} opacity={0.2} spacing={10} />
      </div>

      {/* Left strip */}
      <div
        style={{
          position: 'absolute',
          top: stripSize,
          bottom: stripSize,
          left: 0,
          width: stripSize,
        }}
      >
        <AnyamanStrip width={stripSize} height={600} color={color} opacity={0.2} spacing={10} />
      </div>

      {/* Right strip */}
      <div
        style={{
          position: 'absolute',
          top: stripSize,
          bottom: stripSize,
          right: 0,
          width: stripSize,
        }}
      >
        <AnyamanStrip width={stripSize} height={600} color={color} opacity={0.2} spacing={10} />
      </div>
    </div>
  );
}

// SectionDecor: small woven corner clusters (40x40) in all 4 corners
export function SectionDecor({
  colors,
  variant,
}: DecorProps & { variant: SectionVariant }) {
  const isDark = variant === 'dark';
  const color = isDark ? colors.primary : colors.accent;
  const opacity = 0.25;

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
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <AnyamanCorner color={color} opacity={opacity} />
      </div>

      {/* Top-right corner */}
      <div style={{ position: 'absolute', top: 0, right: 0 }}>
        <AnyamanCorner color={color} opacity={opacity} />
      </div>

      {/* Bottom-left corner */}
      <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <AnyamanCorner color={color} opacity={opacity} />
      </div>

      {/* Bottom-right corner */}
      <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
        <AnyamanCorner color={color} opacity={opacity} />
      </div>
    </div>
  );
}

// FooterDecor: 60px-tall full-width anyaman strip across the top of the footer area
export function FooterDecor({ colors }: DecorProps) {
  const color = colors.accent;
  const stripHeight = 60;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: stripHeight,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <AnyamanStrip
        width="100%"
        height={stripHeight}
        color={color}
        opacity={0.25}
        spacing={8}
      />
    </div>
  );
}
