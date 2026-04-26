import type { FC } from 'react';

export interface DecorColors {
  bg: string;       // main page background
  surface: string;  // light section background
  accent: string;   // accent color (gold etc.)
  primary: string;  // main text/heading color
  dark: string;     // dark section background
}

export interface DecorProps {
  colors: DecorColors;
}

export type SectionVariant = 'light' | 'dark' | 'accent' | 'image-1' | 'image-2';

export interface DecorationConfig {
  colors: DecorColors;
  HeroDecor: FC<DecorProps>;
  SectionDecor: FC<DecorProps & { variant: SectionVariant }>;
  FooterDecor: FC<DecorProps>;
}
