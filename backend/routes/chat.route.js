import express from 'express';
import { handleChatStream, getUserChatHistory, getChatMessages, searchChats } from '../controllers/chat.controller.js'
const router = express.Router();
import { requireAuth } from '../middleware/auth.middleware.js';
import multer from "multer";
import { handleMultimodalChat, handlePDFSummary } from '../controllers/chat.controller.js';

// // This endpoint securely intercepts token payload references via Clerk's base middleware
// router.post('/', handleChatStream);

// Hybrid execution route (Handles rate limits for guests and streaming logs for accounts)
router.post('/prompt',requireAuth, handleChatStream);
// Memory storage keeps files inside RAM buffers instead of writing to disk (Docker safe)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// 1. In-Chat Multimodal Upload (Takes optional photos/files + standard user prompt text)
router.post("/message-multimodal", upload.array("files", 5), handleMultimodalChat);

// 2. Standalone PDF Summarizer Engine
router.post("/pdf-summarize", upload.single("pdf"), handlePDFSummary);


// History management routes protected strictly via Clerk token inspection
router.get('/history', requireAuth, getUserChatHistory);
router.get('/history/:chatId',requireAuth, getChatMessages);

//Specific Search Endpoint (MUST go before any /:id or catch-all routes)
router.get('/search',requireAuth, searchChats);

export default router;
