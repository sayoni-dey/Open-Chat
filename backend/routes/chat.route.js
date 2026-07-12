import express from 'express';
import { handleChatStream, searchChats } from '../controllers/chat.controller.js';

const router = express.Router();

// This endpoint securely intercepts token payload references via Clerk's base middleware
router.post('/', handleChatStream);
// 1. Specific Search Endpoint (MUST go before any /:id or catch-all routes)
router.get('/search', searchChats);
export default router;