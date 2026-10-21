import express from 'express';
import {
  getMachines,
  getMachineStats,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} from '../controllers/machineController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public / Viewer accessible
router.get('/', authenticateToken, getMachines);
router.get('/stats', authenticateToken, getMachineStats);
router.get('/:id', authenticateToken, getMachineById);

// Admin & Engineer accessible
router.put('/:id', authenticateToken, requireRole('admin', 'engineer'), updateMachine);

// Admin only
router.post('/', authenticateToken, requireRole('admin'), createMachine);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteMachine);

export default router;
