import React from 'react';
import type { DecorationConfig, DecorProps, SectionVariant } from './types';

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
};
