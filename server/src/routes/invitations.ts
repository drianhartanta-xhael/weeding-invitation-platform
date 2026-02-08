import { Router } from 'express';
import {
  getInvitation,
  getInvitationForGuest,
} from '../controllers/invitationController';

const router = Router();

// Public routes
router.get('/:slug', getInvitation);
router.get('/:slug/:guestSlug', getInvitationForGuest);

export default router;
