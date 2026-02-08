import { z } from 'zod';

export const createWishSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  message: z.string().min(1, 'Message is required'),
});
