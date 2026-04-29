import { Router } from 'express';
import { previewYoutube } from '../controllers/youtubeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/preview', authenticate, previewYoutube);

export default router;
