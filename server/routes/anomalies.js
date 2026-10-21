import express from 'express';
import {
  getAnomalies,
  getAnomalyStats,
  updateAnomalyStatus,
  createAnomaly,
} from '../controllers/anomalyController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAnomalies);
router.get('/stats', authenticateToken, getAnomalyStats);
router.post('/', authenticateToken, requireRole('admin', 'engineer'), createAnomaly);
router.patch('/:id/status', authenticateToken, requireRole('admin', 'engineer'), updateAnomalyStatus);

export default router;
