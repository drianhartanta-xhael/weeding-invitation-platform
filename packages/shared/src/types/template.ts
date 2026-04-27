export interface ITemplateConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  heroTitle: string;
  heroSubtitle: string;
  bodyGreeting: string;
  footerTitle: string;
  footerMessage: string;
  [key: string]: string;
}

export interface IDefaultSection {
  componentId: string;
  style: string;
  order: number;
}

export interface IStylePreset {
  bg: string;
  text: string;
}

export interface ITemplate {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  description: string;
  isActive: boolean;
  config: ITemplateConfig;
  defaultSections: IDefaultSection[];
  stylePresets: Record<string, IStylePreset>;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTemplateDTO = Omit<ITemplate, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateTemplateDTO = Partial<CreateTemplateDTO>;
