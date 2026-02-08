import { z } from 'zod';

export const createGiftSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  amount: z.number().min(1000, 'Minimum amount is Rp 1.000'),
  message: z.string().optional(),
});
