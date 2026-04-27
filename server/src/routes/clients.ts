import { Router } from 'express';
import {
  getClients,
  getClientById,
  getClientBySlug,
  getClientStats,
  getDashboardStats,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getClients);
router.get('/stats/overview', authenticate, getDashboardStats);
router.get('/slug/:slug', getClientBySlug);
router.get('/:id/stats', authenticate, getClientStats);
router.get('/:id', authenticate, getClientById);
router.post('/', authenticate, createClient);
router.put('/:id', authenticate, updateClient);
router.delete('/:id', authenticate, deleteClient);

export default router;
