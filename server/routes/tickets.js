import express from 'express';
import {
  getTickets,
  getTicketById,
  getTicketStats,
  createTicket,
  updateTicket,
  assignTicket,
  acceptTicket,
  startTicket,
  updateProgress,
  submitResolution,
  approveTicket,
  reworkTicket,
  closeTicket,
  deleteTicket,
} from '../controllers/ticketController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Read routes
router.get('/', authenticateToken, getTickets);
router.get('/stats', authenticateToken, getTicketStats);
router.get('/:id', authenticateToken, getTicketById);

// Admin-only creation & assignment
router.post('/', authenticateToken, requireRole('ADMIN'), createTicket);
router.put('/:id', authenticateToken, requireRole('ADMIN', 'ENGINEER'), updateTicket);
router.post('/:id/assign', authenticateToken, requireRole('ADMIN'), assignTicket);
router.put('/:id/assign', authenticateToken, requireRole('ADMIN'), assignTicket);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteTicket);

// Engineer execution workflow (Admin also permitted)
router.post('/:id/accept', authenticateToken, requireRole('ENGINEER', 'ADMIN'), acceptTicket);
router.put('/:id/accept', authenticateToken, requireRole('ENGINEER', 'ADMIN'), acceptTicket);

router.post('/:id/start', authenticateToken, requireRole('ENGINEER', 'ADMIN'), startTicket);
router.put('/:id/start', authenticateToken, requireRole('ENGINEER', 'ADMIN'), startTicket);

router.post('/:id/progress', authenticateToken, requireRole('ENGINEER', 'ADMIN'), updateProgress);
router.put('/:id/progress', authenticateToken, requireRole('ENGINEER', 'ADMIN'), updateProgress);

router.post('/:id/submit-resolution', authenticateToken, requireRole('ENGINEER', 'ADMIN'), submitResolution);
router.put('/:id/submit-resolution', authenticateToken, requireRole('ENGINEER', 'ADMIN'), submitResolution);
router.post('/:id/resolution', authenticateToken, requireRole('ENGINEER', 'ADMIN'), submitResolution);
router.put('/:id/resolution', authenticateToken, requireRole('ENGINEER', 'ADMIN'), submitResolution);

// Admin review & approval workflow
router.post('/:id/approve', authenticateToken, requireRole('ADMIN'), approveTicket);
router.put('/:id/approve', authenticateToken, requireRole('ADMIN'), approveTicket);

router.post('/:id/rework', authenticateToken, requireRole('ADMIN'), reworkTicket);
router.put('/:id/rework', authenticateToken, requireRole('ADMIN'), reworkTicket);

router.post('/:id/close', authenticateToken, requireRole('ADMIN'), closeTicket);
router.put('/:id/close', authenticateToken, requireRole('ADMIN'), closeTicket);

export default router;
