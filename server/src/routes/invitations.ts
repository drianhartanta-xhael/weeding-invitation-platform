import { Router } from 'express';
import {
  getInvitation,
  getInvitationForGuest,
} from '../controllers/invitationController';
import { publicLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/:slug', publicLimiter, getInvitation);
router.get('/:slug/:guestSlug', publicLimiter, getInvitationForGuest);

export default router;
