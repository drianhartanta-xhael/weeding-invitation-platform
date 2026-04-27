import { Router } from 'express';
import {
  getWishes,
  getPublicWishes,
  createWish,
  approveWish,
  deleteWish,
} from '../controllers/wishController';
import { authenticate } from '../middleware/auth';
import { wishLimiter, publicLimiter } from '../middleware/rateLimiter';

const router = Router();

// Admin routes
router.get('/client/:clientId', authenticate, getWishes);
router.patch('/:id/approve', authenticate, approveWish);
router.delete('/:id', authenticate, deleteWish);

// Public routes
router.get('/public/:clientId', publicLimiter, getPublicWishes);
router.post('/', wishLimiter, createWish);

export default router;
