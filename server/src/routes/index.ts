import { Router } from 'express';
import authRoutes from './auth';
import clientRoutes from './clients';
import guestRoutes from './guests';
import wishRoutes from './wishes';
import giftRoutes from './gifts';
import invitationRoutes from './invitations';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/guests', guestRoutes);
router.use('/wishes', wishRoutes);
router.use('/gifts', giftRoutes);
router.use('/invitations', invitationRoutes);

export default router;
