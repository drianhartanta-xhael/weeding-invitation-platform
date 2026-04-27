export const REGION_STRIPES: Record<string, string> = {
  betawi:
    'repeating-linear-gradient(90deg,#c0392b 0,#c0392b 14px,#d4a017 14px,#d4a017 28px,#1a5c2e 28px,#1a5c2e 42px)',
  sunda:
    'repeating-linear-gradient(90deg,oklch(42% 0.10 155) 0,oklch(42% 0.10 155) 12px,oklch(68% 0.10 75) 12px,oklch(68% 0.10 75) 24px,oklch(52% 0.10 185) 24px,oklch(52% 0.10 185) 36px)',
  batak:
    'repeating-linear-gradient(90deg,#8b1a1a 0,#8b1a1a 6px,#d4a017 6px,#d4a017 12px,#1a0a0a 12px,#1a0a0a 18px,#d4a017 18px,#d4a017 24px,#8b1a1a 24px,#8b1a1a 30px)',
  bali:
    'repeating-conic-gradient(#2d1810 0% 25%,oklch(75% 0.12 72) 0% 50%) 0 0/18px 18px',
  jawa:
    'linear-gradient(90deg,#2a1a08,#7a3b10,#4a5c2e,#b8860b,#2a1a08)',
  padang:
    'repeating-linear-gradient(90deg,#1a1208 0,#1a1208 10px,#c9a030 10px,#c9a030 14px,#8b1a1a 14px,#8b1a1a 26px,#c9a030 26px,#c9a030 30px)',
};

export type RegionKey = keyof typeof REGION_STRIPES;
