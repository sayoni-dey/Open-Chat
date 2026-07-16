import express from 'express';
import { handleChatStream, getUserChatHistory, getChatMessages, searchChats } from '../controllers/chat.controller.js'
const router = express.Router();
import { requireAuth } from '../middleware/auth.middleware.js';

// // This endpoint securely intercepts token payload references via Clerk's base middleware
// router.post('/', handleChatStream);

// Hybrid execution route (Handles rate limits for guests and streaming logs for accounts)
router.post('/prompt',requireAuth, handleChatStream);

// History management routes protected strictly via Clerk token inspection
router.get('/history', requireAuth, getUserChatHistory);
router.get('/history/:chatId',requireAuth, getChatMessages);

//Specific Search Endpoint (MUST go before any /:id or catch-all routes)
router.get('/search',requireAuth, searchChats);

export default router;