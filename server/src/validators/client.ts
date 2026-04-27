import { z } from 'zod';

export const createClientSchema = z.object({
  groomName: z.string().min(1, 'Groom name is required'),
  brideName: z.string().min(1, 'Bride name is required'),
  groomPhoto: z.string().optional(),
  bridePhoto: z.string().optional(),
  groomParents: z
    .object({
      father: z.string().optional(),
      mother: z.string().optional(),
    })
    .optional(),
  brideParents: z
    .object({
      father: z.string().optional(),
      mother: z.string().optional(),
    })
    .optional(),
  eventDate: z.string().min(1, 'Event date is required'),
  events: z
    .array(
      z.object({
        name: z.string().min(1),
        date: z.string().min(1),
        time: z.string().min(1),
        venue: z.string().min(1),
        address: z.string().min(1),
        mapUrl: z.string().optional(),
      })
    )
    .optional(),
  templateId: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  music: z
    .object({
      url: z.string().optional(),
      autoplay: z.boolean().optional(),
    })
    .optional(),
  bankAccounts: z
    .array(
      z.object({
        bank: z.string().min(1),
        accountNumber: z.string().min(1),
        accountName: z.string().min(1),
      })
    )
    .optional(),
  customContent: z
    .object({
      heroTitle: z.string().optional(),
      heroSubtitle: z.string().optional(),
      bodyGreeting: z.string().optional(),
      footerTitle: z.string().optional(),
      footerMessage: z.string().optional(),
    })
    .optional(),
  sections: z
    .array(
      z.object({
        id: z.string().min(1),
        componentId: z.string().min(1),
        data: z.record(z.any()).optional(),
        style: z.string().optional(),
        order: z.number().int().min(0),
      })
    )
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const updateClientSchema = createClientSchema.partial();
