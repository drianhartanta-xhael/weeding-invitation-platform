export interface ITemplateConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  [key: string]: string;
}

export interface ITemplate {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  description: string;
  isActive: boolean;
  config: ITemplateConfig;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTemplateDTO = Omit<ITemplate, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateTemplateDTO = Partial<CreateTemplateDTO>;
