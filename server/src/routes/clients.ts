import { Router } from 'express';
import {
  getClients,
  getClientById,
  getClientBySlug,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getClients);
router.get('/:id', authenticate, getClientById);
router.get('/slug/:slug', getClientBySlug);
router.post('/', authenticate, createClient);
router.put('/:id', authenticate, updateClient);
router.delete('/:id', authenticate, deleteClient);

export default router;
