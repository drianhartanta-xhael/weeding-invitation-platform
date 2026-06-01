import { Router } from 'express';
import multer from 'multer';
import {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  bulkCreateGuests,
  bulkUploadGuests,
  submitRSVP,
  submitOpenRSVP,
  markInvited,
} from '../controllers/guestController';
import { authenticate } from '../middleware/auth';
import { rsvpLimiter } from '../middleware/rateLimiter';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Admin routes
router.get('/client/:clientId', authenticate, getGuests);
router.get('/:id', authenticate, getGuestById);
router.post('/', authenticate, createGuest);
router.put('/:id', authenticate, updateGuest);
router.patch('/:id/invited', authenticate, markInvited);
router.delete('/:id', authenticate, deleteGuest);
router.post('/bulk/:clientId', authenticate, bulkCreateGuests);
router.post('/bulk-upload/:clientId', authenticate, upload.single('file'), bulkUploadGuests);

// Public RSVP
router.post('/rsvp/:clientSlug/:guestSlug', rsvpLimiter, submitRSVP);
router.post('/rsvp/:clientSlug', rsvpLimiter, submitOpenRSVP);

export default router;
