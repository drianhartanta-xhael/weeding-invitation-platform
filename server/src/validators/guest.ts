import { z } from 'zod';

export const createGuestSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  invitationName: z.string().min(1, 'Invitation name is required'),
  slug: z.string().min(1, 'Slug is required'),
});

export const updateGuestSchema = createGuestSchema.partial();

export const rsvpSchema = z.object({
  rsvpStatus: z.enum(['attending', 'notAttending']),
  numberOfGuests: z.number().int().min(1).max(10),
});

export const bulkGuestSchema = z.array(
  z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().optional(),
    invitationName: z.string().min(1),
    slug: z.string().min(1),
  })
);
