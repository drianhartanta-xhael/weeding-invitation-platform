import React from 'react';
import type { DecorationConfig, DecorProps, SectionVariant } from './types';
import { HeroDecor, SectionDecor, FooterDecor, jawaColors } from './jawa';
import { HeroDecor as BaliHeroDecor, SectionDecor as BaliSectionDecor, FooterDecor as BaliFooterDecor, baliColors } from './bali';
import { HeroDecor as SundaHeroDecor, SectionDecor as SundaSectionDecor, FooterDecor as SundaFooterDecor, sundaColors } from './sunda';

const NullDecor: React.FC<DecorProps> = () => null;
const NullSectionDecor: React.FC<DecorProps & { variant: SectionVariant }> = () => null;

const noneConfig: DecorationConfig = {
  colors: {
    bg: '#FEFAE0',
    surface: '#FEFAE0',
    accent: '#D4A373',
    primary: '#606C38',
    dark: '#2D2D2D',
  },
  HeroDecor: NullDecor,
  SectionDecor: NullSectionDecor,
  FooterDecor: NullDecor,
};

export const DECORATION_REGISTRY: Record<string, DecorationConfig> = {
  none: noneConfig,
  jawa: {
    colors: jawaColors,
    HeroDecor,
    SectionDecor,
    FooterDecor,
  },
  bali: {
    colors: baliColors,
    HeroDecor: BaliHeroDecor,
    SectionDecor: BaliSectionDecor,
    FooterDecor: BaliFooterDecor,
  },
  sunda: {
    colors: sundaColors,
    HeroDecor: SundaHeroDecor,
    SectionDecor: SundaSectionDecor,
    FooterDecor: SundaFooterDecor,
  },
};
