import express from 'express';
import {
  getIssues,
  getIssueById,
  createIssue,
  acknowledgeIssue,
  convertToWorkOrder,
  resolveIssue,
} from '../controllers/issueController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getIssues);
router.get('/:id', authenticateToken, getIssueById);
router.post('/', authenticateToken, requireRole('ENGINEER', 'ADMIN'), createIssue);

// Acknowledge
router.post('/:id/acknowledge', authenticateToken, requireRole('ADMIN'), acknowledgeIssue);
router.put('/:id/acknowledge', authenticateToken, requireRole('ADMIN'), acknowledgeIssue);

// Convert to WO
router.post('/:id/convert', authenticateToken, requireRole('ADMIN'), convertToWorkOrder);
router.put('/:id/convert', authenticateToken, requireRole('ADMIN'), convertToWorkOrder);
router.post('/:id/convert-to-wo', authenticateToken, requireRole('ADMIN'), convertToWorkOrder);
router.put('/:id/convert-to-wo', authenticateToken, requireRole('ADMIN'), convertToWorkOrder);

// Resolve
router.post('/:id/resolve', authenticateToken, requireRole('ADMIN'), resolveIssue);
router.put('/:id/resolve', authenticateToken, requireRole('ADMIN'), resolveIssue);

export default router;
