import { Router } from 'express';
import {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  bulkCreateGuests,
  submitRSVP,
} from '../controllers/guestController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Admin routes
router.get('/client/:clientId', authenticate, getGuests);
router.get('/:id', authenticate, getGuestById);
router.post('/', authenticate, createGuest);
router.put('/:id', authenticate, updateGuest);
router.delete('/:id', authenticate, deleteGuest);
router.post('/bulk/:clientId', authenticate, bulkCreateGuests);

// Public RSVP
router.post('/rsvp/:clientSlug/:guestSlug', submitRSVP);

export default router;
