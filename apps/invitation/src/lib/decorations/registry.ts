import type { DecorationConfig } from './types';

const NullDecor = () => null;

const noneConfig: DecorationConfig = {
  colors: {
    bg: '#FEFAE0',
    surface: '#FEFAE0',
    accent: '#D4A373',
    primary: '#606C38',
    dark: '#2D2D2D',
  },
  HeroDecor: NullDecor,
  SectionDecor: NullDecor,
  FooterDecor: NullDecor,
};

export const DECORATION_REGISTRY: Record<string, DecorationConfig> = {
  none: noneConfig,
};
