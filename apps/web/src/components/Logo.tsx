'use client';

import { useId } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * WeddingApp brand monogram.
 * Italic serif "W" inside a rounded square with amber→darker-amber gradient.
 * Replaces the previous Heart icon.
 */
export function Logo({ size = 32, className }: LogoProps) {
  const gradId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WeddingApp logo"
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="9" fill={`url(#${gradId})`} />
      {/* Italic serif "W" stroke — two slanted V shapes joined */}
      <path
        d="M9 12 L14.5 28 L20 18 L25.5 28 L31 12"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="skewX(-10) translate(3.5,0)"
      />
    </svg>
  );
}
