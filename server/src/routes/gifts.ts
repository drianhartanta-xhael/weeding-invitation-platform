import { Router } from 'express';
import {
  getGifts,
  createGift,
  handlePaymentNotification,
} from '../controllers/giftController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Admin routes
router.get('/client/:clientId', authenticate, getGifts);

// Public routes
router.post('/', createGift);

// Midtrans webhook
router.post('/notification', handlePaymentNotification);

export default router;
