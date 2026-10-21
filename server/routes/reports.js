import express from 'express';
import { getReportsData } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getReportsData);

export default router;
