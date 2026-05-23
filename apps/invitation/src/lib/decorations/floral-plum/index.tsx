'use client';

import type { CSSProperties } from 'react';
import type { DecorColors, DecorProps, SectionVariant } from '../types';

export const floralPlumColors: DecorColors = {
  bg: '#f5f3eb',
  surface: '#FFFFFF',
  accent: '#ba6193',
  primary: '#823460',
  dark: '#d9d5c7',
};

// Watercolor wildflower pattern (transparent PNG) shared by all dega-ditta sections.
const FLOWERS = '/assets/dega-ditta/flowers.png';

// A single watercolor wildflower-meadow cluster used as the per-section divider.
const BUNGA = '/assets/dega-ditta/bunga.png';

// A horizontal watercolor floral band that fades toward the section interior.
function FloralBand({ edge }: { edge: 'top' | 'bottom' }) {
  const fadeDir = edge === 'top' ? 'to bottom' : 'to top';
  const mask = `linear-gradient(${fadeDir}, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)`;
  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: edge === 'top' ? 0 : undefined,
    bottom: edge === 'bottom' ? 0 : undefined,
    height: 92,
    backgroundImage: `url('${FLOWERS}')`,
    backgroundRepeat: 'repeat-x',
    backgroundSize: 'auto 220px',
    backgroundPosition: edge === 'top' ? 'center top' : 'center bottom',
    opacity: 0.85,
    WebkitMaskImage: mask,
    maskImage: mask,
    pointerEvents: 'none',
  };
  return <div aria-hidden style={style} />;
}

// A floral corner cluster, faded radially inward (used on the cover overlay).
function FloralCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = pos[0] === 't';
  const isLeft = pos[1] === 'l';
  const cornerX = isLeft ? 'left' : 'right';
  const cornerY = isTop ? 'top' : 'bottom';
  const mask = `radial-gradient(circle at ${cornerX} ${cornerY}, rgba(0,0,0,1) 38%, rgba(0,0,0,0) 78%)`;
  const style: CSSProperties = {
    position: 'absolute',
    top: isTop ? 0 : undefined,
    bottom: isTop ? undefined : 0,
    left: isLeft ? 0 : undefined,
    right: isLeft ? undefined : 0,
    width: 150,
    height: 150,
    backgroundImage: `url('${FLOWERS}')`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '300px auto',
    backgroundPosition: `${cornerX} ${cornerY}`,
    opacity: 0.8,
    WebkitMaskImage: mask,
    maskImage: mask,
    pointerEvents: 'none',
  };
  return <div aria-hidden style={style} />;
}

// HeroDecor — watercolor floral clusters in the four corners (rendered on the cover).
export function HeroDecor(_props: DecorProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <FloralCorner pos="tl" />
      <FloralCorner pos="tr" />
      <FloralCorner pos="bl" />
      <FloralCorner pos="br" />
    </div>
  );
}

// SectionDecor — no overlay for the plum theme; the per-section motif is the in-flow SectionDivider below.
export function SectionDecor(_props: DecorProps & { variant: SectionVariant }) {
  return null;
}

// SectionDivider — a single trimmed wildflower-meadow cluster, centered and rendered in
// normal flow at the bottom of each section, with soft side fades so it blends in.
export function SectionDivider(_props: DecorProps) {
  const mask = 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, transparent 100%)';
  const imgStyle: CSSProperties = {
    width: 'min(320px, 70%)',
    height: 'auto',
    opacity: 0.9,
    WebkitMaskImage: mask,
    maskImage: mask,
    pointerEvents: 'none',
  };
  return (
    <div aria-hidden style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 28 }}>
      <img src={BUNGA} alt="" style={imgStyle} />
    </div>
  );
}

// FooterDecor — a single watercolor floral band across the top of the footer.
export function FooterDecor(_props: DecorProps) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 92, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <FloralBand edge="top" />
    </div>
  );
}
