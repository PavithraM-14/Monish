import express from 'express';
import {
  ingestTelemetry,
  ingestBatchTelemetry,
  getTelemetry,
  getLatestFleetTelemetry,
  exportTelemetryCSV,
} from '../controllers/telemetryController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Ingestion endpoints (used by Python simulator or external sensors)
router.post('/', ingestTelemetry);
router.post('/batch', ingestBatchTelemetry);

// Query endpoints
router.get('/', optionalAuth, getTelemetry);
router.get('/latest', optionalAuth, getLatestFleetTelemetry);
router.get('/export/csv', optionalAuth, exportTelemetryCSV);

export default router;
