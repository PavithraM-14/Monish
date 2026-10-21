import express from 'express';
import { getActivities } from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getActivities);

export default router;
