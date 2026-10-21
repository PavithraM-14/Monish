import express from 'express';
import { handleChatMessage, getChatHistory } from '../controllers/chatController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, handleChatMessage);
router.get('/history', optionalAuth, getChatHistory);

export default router;
