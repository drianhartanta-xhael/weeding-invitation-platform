import React from 'react';
import type { DecorationConfig, DecorProps, SectionVariant } from './types';
import { HeroDecor, SectionDecor, FooterDecor, jawaColors } from './jawa';
import { HeroDecor as BaliHeroDecor, SectionDecor as BaliSectionDecor, FooterDecor as BaliFooterDecor, baliColors } from './bali';
import { HeroDecor as SundaHeroDecor, SectionDecor as SundaSectionDecor, FooterDecor as SundaFooterDecor, sundaColors } from './sunda';
import { HeroDecor as MinangHeroDecor, SectionDecor as MinangSectionDecor, FooterDecor as MinangFooterDecor, minangColors } from './minang';
import { HeroDecor as BetawiHeroDecor, SectionDecor as BetawiSectionDecor, FooterDecor as BetawiFooterDecor, betawiColors } from './betawi';
import { HeroDecor as BatakHeroDecor, SectionDecor as BatakSectionDecor, FooterDecor as BatakFooterDecor, batakColors } from './batak';
import { HeroDecor as FloralHeroDecor, SectionDecor as FloralSectionDecor, FooterDecor as FloralFooterDecor, floralColors } from './floral';
import { HeroDecor as FloralPlumHeroDecor, SectionDecor as FloralPlumSectionDecor, FooterDecor as FloralPlumFooterDecor, floralPlumColors } from './floral-plum';

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
  minang: {
    colors: minangColors,
    HeroDecor: MinangHeroDecor,
    SectionDecor: MinangSectionDecor,
    FooterDecor: MinangFooterDecor,
  },
  betawi: {
    colors: betawiColors,
    HeroDecor: BetawiHeroDecor,
    SectionDecor: BetawiSectionDecor,
    FooterDecor: BetawiFooterDecor,
  },
  batak: {
    colors: batakColors,
    HeroDecor: BatakHeroDecor,
    SectionDecor: BatakSectionDecor,
    FooterDecor: BatakFooterDecor,
  },
  floral: {
    colors: floralColors,
    HeroDecor: FloralHeroDecor,
    SectionDecor: FloralSectionDecor,
    FooterDecor: FloralFooterDecor,
  },
  'floral-plum': {
    colors: floralPlumColors,
    HeroDecor: FloralPlumHeroDecor,
    SectionDecor: FloralPlumSectionDecor,
    FooterDecor: FloralPlumFooterDecor,
  },
};
