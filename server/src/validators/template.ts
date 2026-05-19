import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  slug: z.string().min(1, 'Slug is required'),
  thumbnail: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  decorationStyle: z.string().optional(),
  config: z
    .object({
      primaryColor: z.string().min(1),
      secondaryColor: z.string().min(1),
      accentColor: z.string().min(1),
      fontHeading: z.string().min(1),
      fontBody: z.string().min(1),
      heroTitle: z.string().optional(),
      heroSubtitle: z.string().optional(),
      bodyGreeting: z.string().optional(),
      footerTitle: z.string().optional(),
      footerMessage: z.string().optional(),
    })
    .optional(),
  defaultSections: z
    .array(
      z.object({
        componentId: z.string().min(1),
        style: z.string().optional(),
        order: z.number().int().min(0),
      })
    )
    .optional(),
  stylePresets: z
    .record(
      z.object({
        bg: z.string().min(1),
        text: z.string().min(1),
      })
    )
    .optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();
